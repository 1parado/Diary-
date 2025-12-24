import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  getIncomers,
  getOutgoers,
  getConnectedEdges,
  XYPosition,
  SelectionMode,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ArrowLeft, Save, Plus, Trash2, Download, Settings, Undo, Redo } from 'lucide-react';
import { toast } from 'sonner';
import { MindMapNode } from '../components/mindmap/MindMapNode';
import { MindMapContextMenu } from '../components/mindmap/ContextMenu';
import { ShortcutsPanel } from '../components/mindmap/ShortcutsPanel';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { DownloadButton } from '../components/mindmap/DownloadButton';
import { StylePanel } from '../components/mindmap/StylePanel';

const initialNodes: Node[] = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Root Node' }, type: 'mindMap' },
];
const initialEdges: Edge[] = [];

function MindMapFlow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [nodes, setNodes] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);
  const [copiedData, setCopiedData] = useState<{ nodes: Node[], edges: Edge[] }>({ nodes: [], edges: [] });
  const reactFlowInstance = useReactFlow();
  const mousePosRef = useRef({ x: 0, y: 0 });

  const { takeSnapshot, undo, redo, canUndo, canRedo } = useUndoRedo(setNodes, setEdges);

  const nodeTypes = useMemo(() => ({ mindMap: MindMapNode }), []);

  useEffect(() => {
    if (id) {
      fetchMindMap();
    } else {
        // Initial snapshot for new map
        takeSnapshot(initialNodes, initialEdges);
    }
  }, [id]);

  const fetchMindMap = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/mindmaps/${id}`);
      const data = await res.json();
      if (data.code === 200) {
        setTitle(data.data.title);
        if (data.data.content) {
          const content = JSON.parse(data.data.content);
          const loadedNodes = content.nodes || [];
          const loadedEdges = content.edges || [];
          setNodes(loadedNodes);
          setEdges(loadedEdges);
          takeSnapshot(loadedNodes, loadedEdges);
        }
      }
    } catch (error) {
      toast.error('Failed to load mind map');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const content = JSON.stringify({ nodes, edges });
      const res = await fetch(`http://localhost:8080/api/mindmaps/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content
        })
      });
      if (res.ok) {
        toast.success('Mind map saved');
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast.error('Failed to save mind map');
    } finally {
      setIsSaving(false);
    }
  };

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [setEdges]
  );

  const onConnect = useCallback(
    (params: Connection) => {
        setEdges((eds) => {
            const newEdges = addEdge(params, eds);
            takeSnapshot(nodes, newEdges); // Snapshot with current nodes and NEW edges
            return newEdges;
        });
    },
    [setEdges, nodes, takeSnapshot]
  );

  const onNodeDragStop = useCallback(() => {
      takeSnapshot(nodes, edges);
  }, [nodes, edges, takeSnapshot]);

  const onSelectionChange = useCallback(({ nodes, edges }: { nodes: Node[], edges: Edge[] }) => {
    setSelectedNodes(nodes);
    setSelectedEdges(edges);
  }, []);

  const handleNodeChange = useCallback((id: string, label: string) => {
    setNodes((nds) => {
        const newNodes = nds.map((node) => {
            if (node.id === id) {
              return { ...node, data: { ...node.data, label } };
            }
            return node;
        });
        takeSnapshot(newNodes, edges);
        return newNodes;
    });
  }, [setNodes, edges, takeSnapshot]);

  const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    setEdges((els) => {
        const newEdges = applyEdgeChanges([{ type: 'remove', id: oldEdge.id }], els);
        return addEdge(newConnection, newEdges);
    });
    // We should probably take a snapshot here, but since onReconnect is usually followed by state updates, 
    // and we don't have easy access to the *final* node state here without a ref or dependency, 
    // let's rely on the fact that edges changed.
    // Actually, we can just defer snapshot or take it with current nodes.
    // But better to just wrap this logic properly.
  }, [setEdges]);

  const onReconnectStart = useCallback(() => {
    // Optional: could block other interactions
  }, []);

  const onReconnectEnd = useCallback((_: any, edge: Edge) => {
      // If dropped on pane, maybe delete? Default behavior usually just cancels reconnect.
  }, []);

  const handleNodeUpdate = useCallback((id: string, data: any) => {
      setNodes((nds) => nds.map((node) => {
          if (node.id === id) {
              return { ...node, data: { ...node.data, ...data } };
          }
          return node;
      }));
      // We'll take a snapshot after the update cycle, or debounced. 
      // For color pickers, maybe debounce is better, but for now direct update.
  }, [setNodes]);

  const handleEdgeUpdate = useCallback((id: string, style: any) => {
      setEdges((eds) => eds.map((edge) => {
          if (edge.id === id) {
              return { ...edge, style: { ...edge.style, ...style } };
          }
          return edge;
      }));
  }, [setEdges]);

  // Pass onChange to nodes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: { ...node.data, onChange: handleNodeChange },
      }))
    );
  }, [handleNodeChange, setNodes]);

  const onPaneMouseMove = useCallback((event: React.MouseEvent) => {
    mousePosRef.current = { x: event.clientX, y: event.clientY };
  }, []);


  // --- Node Operations ---

  const getNewNodePos = (baseNode?: Node, offset: { x: number, y: number } = { x: 200, y: 0 }): XYPosition => {
    if (baseNode) {
      return {
        x: baseNode.position.x + offset.x,
        y: baseNode.position.y + offset.y,
      };
    }
    
    // Use mouse position if available
    if (mousePosRef.current.x !== 0 || mousePosRef.current.y !== 0) {
        const position = reactFlowInstance.project({
            x: mousePosRef.current.x,
            y: mousePosRef.current.y
        });
        return position;
    }

    const center = reactFlowInstance.project({ 
        x: window.innerWidth / 2, 
        y: window.innerHeight / 2 
    });
    return center;
  };

  const addNode = useCallback((parentId?: string, mode: 'child' | 'sibling' | 'parent' = 'child', above = false) => {
    const newNodeId = Math.random().toString(36).substr(2, 9);
    let position: XYPosition;
    let parentNode: Node | undefined;
    let sourceId = parentId;

    if (mode === 'parent' && parentId) {
         // Insert Parent Logic
         const currentNode = nodes.find(n => n.id === parentId);
         if (!currentNode) return;

         const incomers = getIncomers(currentNode, nodes, edges);
         position = getNewNodePos(currentNode, { x: -200, y: 0 });

         const newNode: Node = {
            id: newNodeId,
            position,
            data: { label: 'Parent Node', onChange: handleNodeChange },
            type: 'mindMap',
         };

         const edgesToRemove = edges.filter(e => e.target === parentId);
         
         const newIncomerEdges = edgesToRemove.map(e => ({
             ...e,
             id: `e${e.source}-${newNodeId}`,
             target: newNodeId
         }));

         const newEdge: Edge = {
            id: `e${newNodeId}-${parentId}`,
            source: newNodeId,
            target: parentId,
            sourceHandle: 'right',
            targetHandle: 'left',
            updatable: true,
         };
         
         const newEdges = edges.filter(e => !edgesToRemove.includes(e)).concat([...newIncomerEdges, newEdge]);
         const newNodes = nodes.concat(newNode);
         
         setNodes(newNodes);
         setEdges(newEdges);
         takeSnapshot(newNodes, newEdges);
         return; 
    }

    // Child or Sibling Mode
    if (parentId) {
      parentNode = nodes.find(n => n.id === parentId);
      if (mode === 'sibling' && parentNode) {
        const incomers = getIncomers(parentNode, nodes, edges);
        if (incomers.length > 0) {
           parentNode = incomers[0];
           sourceId = parentNode.id;
        } else {
           sourceId = undefined; // Root sibling
        }
      }
    }

    // Calculate position
    if (parentNode) {
        let xOffset = 250;
        const incomers = getIncomers(parentNode, nodes, edges);
        if (incomers.length > 0) {
            const grandparent = incomers[0];
            if (parentNode.position.x < grandparent.position.x) {
                xOffset = -250;
            }
        }
        
        const yOffset = above ? -100 : 100;
        position = getNewNodePos(parentNode, { 
            x: xOffset, 
            y: yOffset 
        });
    } else {
        position = getNewNodePos(undefined);
    }

    const newNode: Node = {
      id: newNodeId,
      position,
      data: { label: 'New Node', onChange: handleNodeChange },
      type: 'mindMap',
    };

    const newNodes = nodes.concat(newNode);
    setNodes(newNodes);

    let newEdges = edges;
    if (sourceId) {
      const sourceNode = newNodes.find(n => n.id === sourceId);
      const targetNode = newNode;
      
      let sourceHandle = 'right';
      let targetHandle = 'left';

      if (sourceNode && targetNode) {
          if (targetNode.position.x < sourceNode.position.x) {
              // Target is to the left of Source
              sourceHandle = 'left-source';
              targetHandle = 'right-target';
          }
      }

      const newEdge: Edge = {
        id: `e${sourceId}-${newNodeId}`,
        source: sourceId,
        target: newNodeId,
        sourceHandle,
        targetHandle,
        updatable: true,
      };
      newEdges = edges.concat(newEdge);
      setEdges(newEdges);
    }
    takeSnapshot(newNodes, newEdges);
  }, [nodes, edges, handleNodeChange, reactFlowInstance, setNodes, setEdges, takeSnapshot]);


  const deleteSelected = useCallback(() => {
    if (selectedNodes.length === 0) return;
    const idsToDelete = new Set(selectedNodes.map(n => n.id));
    
    const newNodes = nodes.filter(n => !idsToDelete.has(n.id));
    const newEdges = edges.filter(e => !idsToDelete.has(e.source) && !idsToDelete.has(e.target));
    
    setNodes(newNodes);
    setEdges(newEdges);
    setSelectedNodes([]);
    takeSnapshot(newNodes, newEdges);
  }, [selectedNodes, nodes, edges, setNodes, setEdges, takeSnapshot]);

  const copyNodes = useCallback(() => {
    if (selectedNodes.length > 0) {
      const selectedNodeIds = new Set(selectedNodes.map(n => n.id));
      // Find edges that are connected between selected nodes
      const selectedEdges = edges.filter(edge => 
        selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)
      );
      
      setCopiedData({ nodes: selectedNodes, edges: selectedEdges });
      toast.success(`Copied ${selectedNodes.length} nodes`);
    }
  }, [selectedNodes, edges]);

  const pasteNodes = useCallback(() => {
    if (copiedData.nodes.length === 0) return;

    const idMap = new Map<string, string>();
    const newNodesToAdd: Node[] = [];

    // 1. Create new nodes and map old IDs to new IDs
    copiedData.nodes.forEach(node => {
        const id = Math.random().toString(36).substr(2, 9);
        idMap.set(node.id, id);
        
        newNodesToAdd.push({
            ...node,
            id,
            position: { x: node.position.x + 50, y: node.position.y + 50 },
            selected: true,
            data: { ...node.data, onChange: handleNodeChange } 
        });
    });

    // 2. Create new edges using the ID map
    const newEdgesToAdd: Edge[] = [];
    copiedData.edges.forEach(edge => {
        const newSource = idMap.get(edge.source);
        const newTarget = idMap.get(edge.target);
        
        if (newSource && newTarget) {
            newEdgesToAdd.push({
                ...edge,
                id: `e${newSource}-${newTarget}`,
                source: newSource,
                target: newTarget,
                selected: false
            });
        }
    });

    const newNodes = [...nodes.map(n => ({...n, selected: false})), ...newNodesToAdd];
    const newEdges = [...edges, ...newEdgesToAdd];
    
    setNodes(newNodes);
    setEdges(newEdges);
    setSelectedNodes(newNodesToAdd);
    takeSnapshot(newNodes, newEdges);
    toast.success('Pasted nodes');
  }, [copiedData, nodes, edges, setNodes, setEdges, handleNodeChange, takeSnapshot]);


  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT') return;

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
          e.preventDefault();
          undo();
          return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
          e.preventDefault();
          redo();
          return;
      }

      if (selectedNodes.length > 0) {
        const primaryNode = selectedNodes[selectedNodes.length - 1];

        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.ctrlKey && e.shiftKey) {
                 addNode(primaryNode.id, 'parent');
            } else if (e.shiftKey) {
                 addNode(primaryNode.id, 'sibling', true); 
            } else if (e.ctrlKey) {
                 addNode(undefined); // Explicit floating
            } else {
                 addNode(primaryNode.id, 'sibling', false); 
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            addNode(primaryNode.id, 'child');
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            deleteSelected();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            copyNodes();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
             e.preventDefault();
             copyNodes();
             pasteNodes();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
             copyNodes();
             deleteSelected();
        }
      } else {
          // Global shortcuts without selection
          if (e.key === 'Enter' || ((e.ctrlKey || e.metaKey) && e.key === 'Enter')) {
             e.preventDefault();
             addNode(undefined); // Create node at mouse position
          }
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
          pasteNodes();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodes, addNode, deleteSelected, copyNodes, pasteNodes, undo, redo]);


  return (
    <MindMapContextMenu
        onAddSibling={() => selectedNodes.length > 0 && addNode(selectedNodes[0].id, 'sibling')}
        onAddChild={() => selectedNodes.length > 0 && addNode(selectedNodes[0].id, 'child')}
        onDelete={deleteSelected}
        onCopy={copyNodes}
        onCut={() => { copyNodes(); deleteSelected(); }}
        onPaste={pasteNodes}
        hasSelection={selectedNodes.length > 0}
        hasClipboard={copiedData.nodes.length > 0}
    >
        <div className="h-screen flex flex-col">
          <div className="h-14 border-b flex items-center justify-between px-4 bg-white z-10">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/mindmap')}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-64 font-medium border-transparent hover:border-gray-200 focus:border-blue-500 transition-all"
              />
              <div className="flex items-center gap-1 border-l pl-4">
                  <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
                      <Undo className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">
                      <Redo className="w-4 h-4" />
                  </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <Button variant="outline" size="sm" onClick={() => addNode(selectedNodes[0]?.id)}>
                <Plus className="w-4 h-4 mr-2" /> Add Node
              </Button>
              <DownloadButton />
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          <div className="flex-1 relative" onMouseMove={onPaneMouseMove}>
            <ShortcutsPanel />
            <StylePanel 
                selectedNode={selectedNodes.length === 1 ? selectedNodes[0] : undefined}
                selectedEdge={selectedEdges.length === 1 ? selectedEdges[0] : undefined}
                onNodeUpdate={handleNodeUpdate}
                onEdgeUpdate={handleEdgeUpdate}
            />
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onReconnect={onReconnect}
              onReconnectStart={onReconnectStart}
              onReconnectEnd={onReconnectEnd}
              onNodeDragStop={onNodeDragStop}
              onSelectionChange={onSelectionChange}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-right"
              selectionKeyCode="Control"
              panOnDrag={true} // Default pan
              selectionMode={SelectionMode.Partial}
              defaultEdgeOptions={{ updatable: true }}
            >
              <Controls />
              <MiniMap />
              <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            </ReactFlow>
          </div>
        </div>
    </MindMapContextMenu>
  );
}

export function MindMapEditor() {
    return (
        <ReactFlowProvider>
            <MindMapFlow />
        </ReactFlowProvider>
    );
}
