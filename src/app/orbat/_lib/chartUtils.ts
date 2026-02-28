import dagre from "@dagrejs/dagre";
import { type Node, type Edge } from "@xyflow/react";
import { type StructuredOrbatElement, type BilletChainNode } from "./queries";

export interface OrbatNodeData extends Record<string, unknown> {
    name: string;
    billets: { role: string; name: string; trooperId: string }[];
    hasParent: boolean;
    hasChildren: boolean;
}

const NODE_WIDTH = 280;
const BILLET_ROW_HEIGHT = 28;
const NODE_HEADER_HEIGHT = 36;
const NODE_MIN_HEIGHT = 60;

function calcNodeHeight(billetCount: number): number {
    return Math.max(NODE_MIN_HEIGHT, NODE_HEADER_HEIGHT + billetCount * BILLET_ROW_HEIGHT);
}

export function buildOrbatGraph(elements: StructuredOrbatElement[]): {
    nodes: Node<OrbatNodeData>[];
    edges: Edge[];
} {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: "TB", ranksep: 80, nodesep: 40, marginx: 40, marginy: 40 });

    const nodes: Node<OrbatNodeData>[] = [];
    const edges: Edge[] = [];

    function walk(el: StructuredOrbatElement, parentId: string | null): void {
        const height = calcNodeHeight(el.billets.length);
        g.setNode(el.id, { width: NODE_WIDTH, height });
        nodes.push({
            id: el.id,
            type: "orbatNode",
            position: { x: 0, y: 0 },
            data: {
                name: el.name,
                billets: el.billets,
                hasParent: parentId !== null,
                hasChildren: el.elements.length > 0,
            },
        });

        if (parentId) {
            g.setEdge(parentId, el.id);
            edges.push({
                id: `${parentId}->${el.id}`,
                source: parentId,
                target: el.id,
                type: "smoothstep",
            });
        }

        for (const child of el.elements) walk(child, el.id);
    }

    for (const root of elements) walk(root, null);

    dagre.layout(g);

    for (const node of nodes) {
        const { x, y, width } = g.node(node.id);
        node.position = { x: x - width / 2, y: y - calcNodeHeight((node.data.billets as OrbatNodeData["billets"]).length) / 2 };
        node.style = { width };
    }

    return { nodes, edges };
}

// ─── Billet chain graph ───────────────────────────────────────────────────────

export interface BilletNodeData extends Record<string, unknown> {
    role: string;
    unitElementName: string;
    unitElementIcon: string;
    trooper: {
        id: string;
        name: string;
        numbers: number;
        rankAbbreviation: string;
    } | null;
    hasParent: boolean;
    hasChildren: boolean;
    hasBottomChildren: boolean; // same-column children → source-bottom handle
    hasRightChildren: boolean;  // cross-column children → source-right handle
    isSubColumnRoot: boolean;   // parent is in a different column → target-left handle
    isCollapsed: boolean;
}

const BILLET_NODE_WIDTH = 230;
const BILLET_NODE_HEIGHT = 70;
const BILLET_NODESEP = 40;  // horizontal gap between sibling subtrees
const BILLET_RANKSEP = 80;  // vertical gap between ranks
const BILLET_MARGINX = 40;  // left margin for root subtrees

export function buildBilletGraph(
    billets: BilletChainNode[],
    allSuperiorIds: Set<string>,
    collapsedIds: Set<string>
): {
    nodes: Node<BilletNodeData>[];
    edges: Edge[];
} {
    if (!billets?.length) return { nodes: [], edges: [] };

    const billetIds = new Set(billets.map((b) => b.id));

    // Build parent→children map preserving query (priority) order
    const childrenOf = new Map<string, BilletChainNode[]>();
    for (const billet of billets) {
        if (billet.superiorBilletId && billetIds.has(billet.superiorBilletId)) {
            if (!childrenOf.has(billet.superiorBilletId)) childrenOf.set(billet.superiorBilletId, []);
            childrenOf.get(billet.superiorBilletId)!.push(billet);
        }
    }

    // Sort siblings using full-graph superior set so collapsed branch nodes still sort first.
    for (const children of childrenOf.values()) {
        children.sort((a, b) => (allSuperiorIds.has(a.id) ? 1 : 0) - (allSuperiorIds.has(b.id) ? 1 : 0));
    }

    const roots = billets.filter((b) => !b.superiorBilletId || !billetIds.has(b.superiorBilletId));

    // ── Custom compact tree layout ────────────────────────────────────────────
    // subtreeWidth: minimum width this node's subtree needs so no nodes overlap.
    // A leaf needs exactly one node width. An internal node needs at least the
    // sum of its children's subtree widths plus gaps between them.
    const widthCache = new Map<string, number>();
    function subtreeWidth(nodeId: string): number {
        if (widthCache.has(nodeId)) return widthCache.get(nodeId)!;
        const children = childrenOf.get(nodeId) ?? [];
        const w =
            children.length === 0
                ? BILLET_NODE_WIDTH
                : Math.max(
                      BILLET_NODE_WIDTH,
                      children.reduce((sum, c) => sum + subtreeWidth(c.id), 0) +
                          (children.length - 1) * BILLET_NODESEP
                  );
        widthCache.set(nodeId, w);
        return w;
    }

    const xMap = new Map<string, number>(); // top-left x for each node
    const yMap = new Map<string, number>(); // top-left y for each node

    // placeSubtree: assign positions recursively.
    // centerX is the horizontal centre of this subtree.
    // depth drives the vertical position (rank).
    function placeSubtree(nodeId: string, centerX: number, depth: number): void {
        xMap.set(nodeId, centerX - BILLET_NODE_WIDTH / 2);
        yMap.set(nodeId, depth * (BILLET_NODE_HEIGHT + BILLET_RANKSEP));

        const children = childrenOf.get(nodeId) ?? [];
        if (children.length === 0) return;

        const childWidths = children.map((c) => subtreeWidth(c.id));
        const totalWidth =
            childWidths.reduce((a, b) => a + b, 0) + (children.length - 1) * BILLET_NODESEP;

        let curX = centerX - totalWidth / 2;
        for (let i = 0; i < children.length; i++) {
            placeSubtree(children[i].id, curX + childWidths[i] / 2, depth + 1);
            curX += childWidths[i] + BILLET_NODESEP;
        }
    }

    // Lay root subtrees out left-to-right with gaps between them
    let curX = BILLET_MARGINX;
    for (const root of roots) {
        const w = subtreeWidth(root.id);
        placeSubtree(root.id, curX + w / 2, 0);
        curX += w + BILLET_NODESEP;
    }

    // Any billet not reachable from roots (disconnected / cycle) gets a fallback position
    const billetById = new Map(billets.map((b) => [b.id, b]));
    let orphanX = BILLET_MARGINX;
    for (const id of billetById.keys()) {
        if (!xMap.has(id)) {
            xMap.set(id, orphanX);
            yMap.set(id, -(BILLET_NODE_HEIGHT + BILLET_RANKSEP));
            orphanX += BILLET_NODE_WIDTH + BILLET_NODESEP;
        }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const nodes: Node<BilletNodeData>[] = [];
    const edges: Edge[] = [];

    for (const billet of billets) {
        const hasParent = !!billet.superiorBilletId && billetIds.has(billet.superiorBilletId);
        nodes.push({
            id: billet.id,
            type: "billetNode",
            position: { x: xMap.get(billet.id)!, y: yMap.get(billet.id)! },
            style: { width: BILLET_NODE_WIDTH, transition: "transform 250ms ease" },
            data: {
                role: billet.role,
                unitElementName: billet.unitElementName,
                unitElementIcon: billet.unitElementIcon,
                trooper: billet.trooper,
                hasParent,
                hasChildren: allSuperiorIds.has(billet.id),
                hasBottomChildren: allSuperiorIds.has(billet.id),
                hasRightChildren: false,
                isSubColumnRoot: false,
                isCollapsed: collapsedIds.has(billet.id),
            },
        });

        if (hasParent) {
            edges.push({
                id: `${billet.superiorBilletId}->${billet.id}`,
                source: billet.superiorBilletId!,
                target: billet.id,
                type: "smoothstep",
                sourceHandle: "source-bottom",
                targetHandle: "target-top",
            });
        }
    }

    return { nodes, edges };
}

// ─── Sequential column layout ─────────────────────────────────────────────────
// Same UE billets stack vertically in a column.
// When a billet's children are in a different UE they form child column segments
// that are placed BELOW the parent column (centered under it), exactly like a
// classic org-chart but where each "node" is a vertical column of billets.

interface ColumnSeg {
    parentBilletId: string | null;  // billet in parent column that spawned this
    billets: BilletChainNode[];     // pre-order DFS order within this UE
    childSegs: ColumnSeg[][];       // childSegs[i] = sub-columns branching from billets[i]
}

const SEQ_COL_GAP = 60;          // horizontal gap between sibling columns
const SEQ_RANK_GAP = 80;          // vertical gap between parent column bottom and child column top
const SEQ_NODE_HEIGHT_BASE = 70;  // height of a leaf billet node
const SEQ_NODE_HEIGHT_PARENT = 95; // height of a parent billet node (includes chevron section)
const SEQ_NODE_GAP = 20;          // visual gap between consecutive nodes in a column

export function buildSequentialGraph(
    visibleBillets: BilletChainNode[],
    allActiveBillets: BilletChainNode[],
    allSuperiorIds: Set<string>,
    collapsedIds: Set<string>
): { nodes: Node<BilletNodeData>[]; edges: Edge[] } {
    if (!allActiveBillets?.length) return { nodes: [], edges: [] };

    // Layout is built from allActiveBillets so X positions are stable across collapse/expand.
    // Nodes and edges are only emitted for visibleBillets.
    const allBilletIds = new Set(allActiveBillets.map((b) => b.id));
    const visibleBilletIds = new Set(visibleBillets.map((b) => b.id));
    const billetById = new Map(allActiveBillets.map((b) => [b.id, b]));

    // childrenOf built from allActiveBillets (priority order preserved from query)
    const childrenOf = new Map<string, BilletChainNode[]>();
    for (const b of allActiveBillets) {
        if (b.superiorBilletId && allBilletIds.has(b.superiorBilletId)) {
            const arr = childrenOf.get(b.superiorBilletId) ?? [];
            arr.push(b);
            childrenOf.set(b.superiorBilletId, arr);
        }
    }

    // Build a column segment: DFS within the same UE, branching when UE changes.
    function buildSeg(
        roots: BilletChainNode[],
        parentBilletId: string | null,
        segUE: string | null
    ): ColumnSeg {
        const seg: ColumnSeg = { parentBilletId, billets: [], childSegs: [] };

        function dfs(b: BilletChainNode) {
            const idx = seg.billets.length;
            seg.billets.push(b);
            seg.childSegs.push([]);

            const children = childrenOf.get(b.id) ?? [];
            const sameUE = children.filter((c) => (c.unitElementId ?? null) === segUE);
            const diffUE = children.filter((c) => (c.unitElementId ?? null) !== segUE);

            // Group diff-UE children by their UE → one sub-seg per UE group
            const byUE = new Map<string | null, BilletChainNode[]>();
            for (const c of diffUE) {
                const ue = c.unitElementId ?? null;
                if (!byUE.has(ue)) byUE.set(ue, []);
                byUE.get(ue)!.push(c);
            }
            for (const [childUE, ueRoots] of byUE) {
                seg.childSegs[idx].push(buildSeg(ueRoots, b.id, childUE));
            }

            // Continue DFS with same-UE children (priority order preserved)
            for (const child of sameUE) dfs(child);
        }

        for (const root of roots) dfs(root);
        return seg;
    }

    // Total horizontal footprint of a segment including all descendant columns.
    const widthCache = new Map<ColumnSeg, number>();
    function seqSegWidth(seg: ColumnSeg): number {
        if (widthCache.has(seg)) return widthCache.get(seg)!;
        const allChildren: ColumnSeg[] = [];
        for (const subSegs of seg.childSegs) for (const s of subSegs) allChildren.push(s);
        const w =
            allChildren.length === 0
                ? BILLET_NODE_WIDTH
                : Math.max(
                      BILLET_NODE_WIDTH,
                      allChildren.reduce((sum, c) => sum + seqSegWidth(c), 0) +
                          (allChildren.length - 1) * SEQ_COL_GAP
                  );
        widthCache.set(seg, w);
        return w;
    }

    function nodeHeight(b: BilletChainNode): number {
        return allSuperiorIds.has(b.id) ? SEQ_NODE_HEIGHT_PARENT : SEQ_NODE_HEIGHT_BASE;
    }

    const xMap = new Map<string, number>();
    const yMap = new Map<string, number>();

    function placeSeg(seg: ColumnSeg, centerX: number, startY: number) {
        // Stack billets vertically with consistent visual gap between each.
        let curY = startY;
        for (const b of seg.billets) {
            xMap.set(b.id, centerX - BILLET_NODE_WIDTH / 2);
            yMap.set(b.id, curY);
            curY += nodeHeight(b) + SEQ_NODE_GAP;
        }

        // Collect all child sub-segments across all billets in this column.
        const allChildren: ColumnSeg[] = [];
        for (const subSegs of seg.childSegs) for (const s of subSegs) allChildren.push(s);
        if (allChildren.length === 0) return;

        // Child columns start SEQ_RANK_GAP below the bottom of the last billet.
        // curY is already at (lastBilletBottom + SEQ_NODE_GAP), so subtract the gap back.
        const childStartY = curY - SEQ_NODE_GAP + SEQ_RANK_GAP;

        const childTotalWidth =
            allChildren.reduce((sum, c) => sum + seqSegWidth(c), 0) +
            (allChildren.length - 1) * SEQ_COL_GAP;
        let childX = centerX - childTotalWidth / 2;

        for (const subSeg of allChildren) {
            const w = seqSegWidth(subSeg);
            placeSeg(subSeg, childX + w / 2, childStartY);
            childX += w + SEQ_COL_GAP;
        }
    }

    // Each top-level billet (no superior in dataset) is its own column root,
    // placed side by side horizontally — they are "equal level" peers.
    const topLevelBillets = allActiveBillets.filter(
        (b) => !b.superiorBilletId || !allBilletIds.has(b.superiorBilletId)
    );

    const topSegs: ColumnSeg[] = topLevelBillets.map((b) =>
        buildSeg([b], null, b.unitElementId ?? null)
    );

    // Place top-level segments side-by-side from x=0
    let curX = 0;
    for (const seg of topSegs) {
        const w = seqSegWidth(seg);
        placeSeg(seg, curX + w / 2, 0);
        curX += w + SEQ_COL_GAP;
    }

    // Orphan fallback (disconnected / cycle)
    let orphanX = 0;
    for (const b of allActiveBillets) {
        if (!xMap.has(b.id)) {
            xMap.set(b.id, orphanX);
            yMap.set(b.id, -(SEQ_NODE_HEIGHT_BASE + SEQ_NODE_GAP));
            orphanX += BILLET_NODE_WIDTH + SEQ_COL_GAP;
        }
    }

    // Index segments so cross-column edges originate from the LAST billet in the
    // parent column, making the fork appear at the bottom of the column.
    const lastBilletOfSeg = new Map<string, string>();
    const lastBilletsWithCrossCol = new Set<string>();

    function indexSeg(seg: ColumnSeg) {
        if (!seg.billets.length) return;
        const lastId = seg.billets[seg.billets.length - 1].id;
        for (const b of seg.billets) lastBilletOfSeg.set(b.id, lastId);
        if (seg.childSegs.some((s) => s.length > 0)) lastBilletsWithCrossCol.add(lastId);
        for (const subSegs of seg.childSegs) for (const sub of subSegs) indexSeg(sub);
    }
    for (const seg of topSegs) indexSeg(seg);

    // Emit nodes and edges only for visibleBillets (layout positions from allActiveBillets).
    const nodes: Node<BilletNodeData>[] = [];
    const edges: Edge[] = [];

    for (const billet of visibleBillets) {
        const hasParent = !!billet.superiorBilletId && allBilletIds.has(billet.superiorBilletId);
        const hasAnyChildren = allSuperiorIds.has(billet.id);
        const hasBottomChildren = hasAnyChildren || lastBilletsWithCrossCol.has(billet.id);

        nodes.push({
            id: billet.id,
            type: "billetNode",
            position: { x: xMap.get(billet.id)!, y: yMap.get(billet.id)! },
            style: { width: BILLET_NODE_WIDTH },
            data: {
                role: billet.role,
                unitElementName: billet.unitElementName,
                unitElementIcon: billet.unitElementIcon,
                trooper: billet.trooper,
                hasParent,
                hasChildren: hasAnyChildren,
                hasBottomChildren,
                hasRightChildren: false,
                isSubColumnRoot: false,
                isCollapsed: collapsedIds.has(billet.id),
            },
        });

        if (hasParent) {
            const parent = billetById.get(billet.superiorBilletId!)!;
            const isCrossColumn =
                (parent.unitElementId ?? null) !== (billet.unitElementId ?? null);
            const rawSource = billet.superiorBilletId!;
            // For cross-column edges, reroute source to the last billet of the parent's
            // segment so the fork exits from the column bottom. Fall back to direct parent
            // if the last billet is not currently visible.
            const edgeSource = isCrossColumn
                ? (() => {
                      const last = lastBilletOfSeg.get(rawSource) ?? rawSource;
                      return visibleBilletIds.has(last) ? last : rawSource;
                  })()
                : rawSource;

            edges.push({
                id: `${billet.superiorBilletId}->${billet.id}`,
                source: edgeSource,
                target: billet.id,
                type: "smoothstep",
                sourceHandle: "source-bottom",
                targetHandle: "target-top",
            });
        }
    }

    return { nodes, edges };
}
