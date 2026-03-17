/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import type {
  Config,
  ToolCall,
  ToolCallsUpdateMessage,
  ThoughtSummary,

  CoreToolCallStatus} from '@google/gemini-cli-core';
import {
  MessageBusType,
  ROOT_SCHEDULER_ID
} from '@google/gemini-cli-core';

export type ExecutionTreeNodeType = 'prompt' | 'thought' | 'scheduler' | 'tool';

export interface ExecutionTreeNode {
  id: string;
  type: ExecutionTreeNodeType;
  label: string;
  children: ExecutionTreeNode[];
  status?: CoreToolCallStatus;
  name?: string;
  schedulerId?: string;
  parentId?: string | null;
}

export interface ExecutionTreeState {
  roots: ExecutionTreeNode[];
  hasActivity: boolean;
}

interface SchedulerMetadata {
  schedulerId: string;
  parentCallId?: string;
}

export function useExecutionTree(
  config: Config,
  thought: ThoughtSummary | null,
  options?: {
    maxNodesPerScheduler?: number;
  },
): ExecutionTreeState {
  const [toolCallsByScheduler, setToolCallsByScheduler] = useState<
    Record<string, ToolCall[]>
  >({});

  // Subscribe to TOOL_CALLS_UPDATE to maintain an in-memory snapshot of tool calls
  useEffect(() => {
    const messageBus = config.getMessageBus();

    const handler = (event: ToolCallsUpdateMessage) => {
      const incomingCalls = Array.isArray(event.toolCalls)
        ? event.toolCalls
        : [];

      // #region agent log
      // Instrument TOOL_CALLS_UPDATE ingestion to validate toolCalls shape (H1, H2, H3)
       
      fetch(
        'http://127.0.0.1:7380/ingest/d7d027c6-ac4c-46af-9b8e-912da414c180',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': '4676a3',
          },
          body: JSON.stringify({
            sessionId: '4676a3',
            runId: 'pre-fix-1',
            hypothesisId: 'H1',
            location: 'useExecutionTree.ts:62',
            message: 'TOOL_CALLS_UPDATE received',
            data: {
              schedulerId: event.schedulerId,
              hasToolCallsProp: Object.prototype.hasOwnProperty.call(
                event,
                'toolCalls',
              ),
              toolCallsType: typeof event.toolCalls,
              isArray: Array.isArray(event.toolCalls),
              incomingLength: incomingCalls.length,
            },
            timestamp: Date.now(),
          }),
        },
      ).catch(() => {});
      // #endregion agent log
      setToolCallsByScheduler((prev) => {
        if (prev[event.schedulerId] === incomingCalls) {
          return prev;
        }
        return {
          ...prev,
          [event.schedulerId]: incomingCalls,
        };
      });
    };

    messageBus.subscribe(MessageBusType.TOOL_CALLS_UPDATE, handler);
    return () => {
      messageBus.unsubscribe(MessageBusType.TOOL_CALLS_UPDATE, handler);
    };
  }, [config]);

  const maxNodesPerScheduler =
    options?.maxNodesPerScheduler && options.maxNodesPerScheduler > 0
      ? options.maxNodesPerScheduler
      : undefined;

  const { roots, hasActivity } = useMemo(() => {
    const schedulerIds = Object.keys(toolCallsByScheduler);

    if (schedulerIds.length === 0 && !thought) {
      return { roots: [] as ExecutionTreeNode[], hasActivity: false };
    }

    const allToolCalls: ToolCall[] = schedulerIds.flatMap((sid) => {
      const calls = toolCallsByScheduler[sid];
      return Array.isArray(calls) ? calls : [];
    });

    if (allToolCalls.length === 0 && !thought) {
      return { roots: [] as ExecutionTreeNode[], hasActivity: false };
    }

    // Optional cap per scheduler to keep the tree bounded for very large batches.
    const cappedToolCallsByScheduler: Record<string, ToolCall[]> = {};
    for (const schedulerId of schedulerIds) {
      const stored = toolCallsByScheduler[schedulerId];
      const calls = Array.isArray(stored) ? stored : [];
      if (!maxNodesPerScheduler || calls.length <= maxNodesPerScheduler) {
        cappedToolCallsByScheduler[schedulerId] = calls;
      } else {
        // Keep the most recent calls, which tend to be the most relevant.
        cappedToolCallsByScheduler[schedulerId] = calls.slice(
          calls.length - maxNodesPerScheduler,
        );
      }
    }

    const allCappedCalls: ToolCall[] = Object.values(
      cappedToolCallsByScheduler,
    ).flat();

    // #region agent log
    // Instrument tree build to capture aggregate counts (H2, H3)
     
    fetch('http://127.0.0.1:7380/ingest/d7d027c6-ac4c-46af-9b8e-912da414c180', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '4676a3',
      },
      body: JSON.stringify({
        sessionId: '4676a3',
        runId: 'pre-fix-1',
        hypothesisId: 'H2',
        location: 'useExecutionTree.ts:118',
        message: 'Execution tree aggregation snapshot',
        data: {
          schedulerCount: schedulerIds.length,
          totalToolCalls: allToolCalls.length,
          totalCappedCalls: allCappedCalls.length,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion agent log

    const toolNodeById = new Map<string, ExecutionTreeNode>();
    const schedulerMetaById = new Map<string, SchedulerMetadata>();

    // Pre-create scheduler metadata so we can attach them later.
    for (const [schedulerId, calls] of Object.entries(
      cappedToolCallsByScheduler,
    )) {
      let parentCallId: string | undefined;
      for (const call of calls) {
        if (call.request.parentCallId) {
          parentCallId = call.request.parentCallId;
          break;
        }
      }
      schedulerMetaById.set(schedulerId, { schedulerId, parentCallId });
    }

    // Create tool nodes.
    for (const call of allCappedCalls) {
      const id = call.request.callId;
      const schedulerId = call.schedulerId ?? ROOT_SCHEDULER_ID;
      const label = call.request.name;

      toolNodeById.set(id, {
        id,
        type: 'tool',
        label,
        name: call.request.name,
        status: call.status as CoreToolCallStatus,
        schedulerId,
        parentId: null,
        children: [],
      });
    }

    // Create scheduler nodes.
    const schedulerNodeById = new Map<string, ExecutionTreeNode>();
    for (const [schedulerId, meta] of schedulerMetaById.entries()) {
      const isRoot = schedulerId === ROOT_SCHEDULER_ID;
      const label = isRoot ? 'Root agent' : `Subagent ${schedulerId}`;

      schedulerNodeById.set(schedulerId, {
        id: schedulerId,
        type: 'scheduler',
        label,
        schedulerId,
        parentId: meta.parentCallId ?? null,
        children: [],
      });
    }

    // Ensure there is always a root scheduler node for orphaned calls.
    if (!schedulerNodeById.has(ROOT_SCHEDULER_ID)) {
      schedulerNodeById.set(ROOT_SCHEDULER_ID, {
        id: ROOT_SCHEDULER_ID,
        type: 'scheduler',
        label: 'Root agent',
        schedulerId: ROOT_SCHEDULER_ID,
        parentId: null,
        children: [],
      });
    }

    // Attach tool nodes to either their parent tool or their scheduler.
    for (const call of allCappedCalls) {
      const node = toolNodeById.get(call.request.callId);
      if (!node) continue;

      const parentCallId = call.request.parentCallId;
      if (parentCallId && toolNodeById.has(parentCallId)) {
        node.parentId = parentCallId;
        const parentNode = toolNodeById.get(parentCallId)!;
        parentNode.children.push(node);
      } else {
        const sid = call.schedulerId ?? ROOT_SCHEDULER_ID;
        const schedulerNode =
          schedulerNodeById.get(sid) ??
          schedulerNodeById.get(ROOT_SCHEDULER_ID)!;
        node.parentId = schedulerNode.id;
        schedulerNode.children.push(node);
      }
    }

    // Attach scheduler nodes under their parent tool call when available.
    const schedulerRoots: ExecutionTreeNode[] = [];
    for (const schedulerNode of schedulerNodeById.values()) {
      if (
        schedulerNode.id === ROOT_SCHEDULER_ID ||
        !schedulerNode.parentId ||
        !toolNodeById.has(schedulerNode.parentId)
      ) {
        schedulerRoots.push(schedulerNode);
      } else {
        const parentTool = toolNodeById.get(schedulerNode.parentId)!;
        parentTool.children.push(schedulerNode);
      }
    }

    // Build the prompt root node and optional thought node.
    const promptRoot: ExecutionTreeNode = {
      id: 'prompt-root',
      type: 'prompt',
      label: 'Prompt',
      parentId: null,
      children: [],
    };

    let attachParent: ExecutionTreeNode = promptRoot;

    if (thought) {
      const thoughtLabel = thought.subject?.trim()
        ? thought.subject
        : 'Thinking...';
      const thoughtNode: ExecutionTreeNode = {
        id: 'thought-node',
        type: 'thought',
        label: thoughtLabel,
        parentId: promptRoot.id,
        children: [],
      };
      promptRoot.children.push(thoughtNode);
      attachParent = thoughtNode;
    }

    for (const schedulerNode of schedulerRoots) {
      attachParent.children.push(schedulerNode);
      schedulerNode.parentId = attachParent.id;
    }

    const promptHasChildren = promptRoot.children.length > 0;
    const hasAnyActivity = promptHasChildren || !!thought;

    return {
      roots: promptHasChildren ? [promptRoot] : [],
      hasActivity: hasAnyActivity,
    };
  }, [toolCallsByScheduler, thought, maxNodesPerScheduler]);

  return { roots, hasActivity };
}
