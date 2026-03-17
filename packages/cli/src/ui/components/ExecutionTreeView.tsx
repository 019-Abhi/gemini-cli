/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import type { ExecutionTreeState } from '../hooks/useExecutionTree.js';
import { ExecutionTreeNodeView } from './ExecutionTreeNode.js';
import { theme } from '../semantic-colors.js';

interface ExecutionTreeViewProps {
  tree: ExecutionTreeState;
}

export const ExecutionTreeView: React.FC<ExecutionTreeViewProps> = ({
  tree,
}) => {
  if (!tree.hasActivity || tree.roots.length === 0) {
    return null;
  }

  return (
    <Box
      flexDirection="column"
      width="100%"
      paddingLeft={1}
      marginTop={1}
      marginBottom={1}
    >
      <Text color={theme.text.secondary} bold>
        Execution
      </Text>
      {tree.roots.map((root, index) => (
        <ExecutionTreeNodeView
          key={root.id}
          node={root}
          prefix=""
          isLast={index === tree.roots.length - 1}
        />
      ))}
    </Box>
  );
};
