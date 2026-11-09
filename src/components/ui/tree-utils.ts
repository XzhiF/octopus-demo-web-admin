export interface TreeNodeData {
  id: number
  label: string
  disabled?: boolean
  children?: TreeNodeData[]
}

export type CheckState = 'checked' | 'indeterminate' | 'unchecked'

/** Pre-order id list of the whole forest. */
export function collectIds(nodes: TreeNodeData[]): number[] {
  const ids: number[] = []
  const walk = (list: TreeNodeData[]) => {
    for (const node of list) {
      ids.push(node.id)
      if (node.children?.length) walk(node.children)
    }
  }
  walk(nodes)
  return ids
}

export function findNode(nodes: TreeNodeData[], id: number): TreeNodeData | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    const hit = node.children ? findNode(node.children, id) : undefined
    if (hit) return hit
  }
  return undefined
}

function collectSubtreeIds(node: TreeNodeData): number[] {
  const ids = [node.id]
  node.children?.forEach((child) => ids.push(...collectSubtreeIds(child)))
  return ids
}

function isSubtreeChecked(node: TreeNodeData, checked: ReadonlySet<number>): boolean {
  return collectSubtreeIds(node).every((id) => checked.has(id))
}

function buildParentMap(nodes: TreeNodeData[], parent?: TreeNodeData, map = new Map<number, TreeNodeData>()) {
  for (const node of nodes) {
    if (parent) map.set(node.id, parent)
    if (node.children?.length) buildParentMap(node.children, node, map)
  }
  return map
}

/**
 * Derives the visual state of every node from the checked id set.
 * A branch is `checked` when its whole subtree is checked, `indeterminate`
 * when only part of it is, and `unchecked` otherwise.
 */
export function computeCheckStates(
  nodes: TreeNodeData[],
  checked: ReadonlySet<number>,
): Map<number, CheckState> {
  const states = new Map<number, CheckState>()

  const walk = (node: TreeNodeData): CheckState => {
    const children = node.children ?? []
    let state: CheckState
    if (children.length === 0) {
      state = checked.has(node.id) ? 'checked' : 'unchecked'
    } else {
      const childStates = children.map(walk)
      if (childStates.every((s) => s === 'checked')) {
        state = 'checked'
      } else if (childStates.every((s) => s === 'unchecked')) {
        state = checked.has(node.id) ? 'checked' : 'unchecked'
      } else {
        state = 'indeterminate'
      }
    }
    states.set(node.id, state)
    return state
  }

  nodes.forEach(walk)
  return states
}

/**
 * Checks/unchecks a node together with its whole subtree, then re-derives the
 * ancestors: a parent stays checked only while every child subtree is checked.
 */
export function toggleNode(
  nodes: TreeNodeData[],
  checked: ReadonlySet<number>,
  id: number,
  next: boolean,
): Set<number> {
  const target = findNode(nodes, id)
  const result = new Set(checked)
  if (!target) return result

  for (const nodeId of collectSubtreeIds(target)) {
    if (next) result.add(nodeId)
    else result.delete(nodeId)
  }

  const parents = buildParentMap(nodes)
  let parent = parents.get(id)
  while (parent) {
    const children = parent.children ?? []
    if (children.length > 0 && children.every((child) => isSubtreeChecked(child, result))) {
      result.add(parent.id)
    } else {
      result.delete(parent.id)
    }
    parent = parents.get(parent.id)
  }

  return result
}

/** Ordered id array derived from the forest pre-order, filtered by the checked set. */
export function toOrderedIds(nodes: TreeNodeData[], checked: ReadonlySet<number>): number[] {
  return collectIds(nodes).filter((id) => checked.has(id))
}
