/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import type { ExecutionTreeNode } from '../hooks/useExecutionTree.js';
import { ToolStatusIndicator } from './messages/ToolShared.js';
import { theme } from '../semantic-colors.js';

interface ExecutionTreeNodeProps {
  node: ExecutionTreeNode;
  prefix: string;
  isLast: boolean;
}

export const ExecutionTreeNodeView: React.FC<ExecutionTreeNodeProps> = ({
  node,
  prefix,
  isLast,
}) => {
  const branch = `${prefix}${isLast ? '└─ ' : '├─ '}`;
  const nextPrefix = `${prefix}${isLast ? '   ' : '│  '}`;

  const renderLabel = () => {
    if (node.type === 'prompt') {
      return (
        <Text color={theme.text.accent} bold>
          {node.label}
        </Text>
      );
    }

    if (node.type === 'thought') {
      return (
        <Text color={theme.text.secondary} wrap="truncate">
          Thought: {node.label}
        </Text>
      );
    }

    if (node.type === 'scheduler') {
      return (
        <Text color={theme.text.secondary} wrap="truncate">
          {node.label}
        </Text>
      );
    }

    // node.type === 'tool'
    return (
      <Box flexDirection="row">
        {node.status && node.name && (
          <ToolStatusIndicator status={node.status} name={node.name} />
        )}
        <Text wrap="truncate">
          <Text color={theme.text.primary} bold>
            {node.name ?? node.label}
          </Text>
        </Text>
      </Box>
    );
  };

  return (
    <Box flexDirection="column">
      <Box flexDirection="row">
        <Text>{branch}</Text>
        <Box flexDirection="row" flexGrow={1}>
          {renderLabel()}
        </Box>
      </Box>
      {node.children.map((child, index) => (
        <ExecutionTreeNodeView
          key={child.id}
          node={child}
          prefix={nextPrefix}
          isLast={index === node.children.length - 1}
        />
      ))}
    </Box>
  );
};
