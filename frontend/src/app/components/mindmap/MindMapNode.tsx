import React, { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
import { cn } from '../ui/utils';

const HandleStyle = { width: 12, height: 12, background: '#78716c', border: '2px solid #fff' };

const CustomHandle = ({ position, type, id, style }: { position: Position; type: 'source' | 'target'; id?: string; style?: React.CSSProperties }) => {
  return (
    <Handle
      type={type}
      position={position}
      id={id}
      style={style}
      className={cn(
        "w-3 h-3 bg-stone-500 border-2 border-white transition-all opacity-0 group-hover:opacity-100 hover:bg-blue-500 hover:scale-125",
        // Increase hit area
        "before:content-[''] before:absolute before:w-6 before:h-6 before:-top-1.5 before:-left-1.5 before:-z-10"
      )}
    />
  );
};

export const MindMapNode = memo(({ data, selected, id }: NodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLabel(data.label);
  }, [data.label]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLabel(e.target.value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (data.onChange) {
      data.onChange(id, label);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
  };

  return (
    <div 
      className={cn(
        "group px-4 py-2 shadow-md rounded-md bg-white border-2 min-w-[100px] max-w-[400px] max-h-[300px] overflow-auto text-center transition-all grid",
        selected ? "border-blue-500 ring-2 ring-blue-200" : "border-stone-200 hover:border-blue-300",
        data.style // Custom styles passed via data
      )}
      style={{ 
        backgroundColor: data.color || '#fff',
        color: data.textColor || 'inherit',
        fontSize: data.fontSize || 'inherit',
        fontWeight: data.fontWeight || '500',
      }}
      onDoubleClick={handleDoubleClick}
    >
      <CustomHandle type="target" position={Position.Top} id="top" />
      
      {/* Left handles */}
      <CustomHandle type="target" position={Position.Left} id="left" />
      <CustomHandle type="source" position={Position.Left} id="left-source" />
      
      {/* Mirror Div for sizing */}
      <div className={cn(
          "col-start-1 row-start-1 min-h-[1.5em] whitespace-pre-wrap break-words min-w-[100px] text-center pointer-events-none",
          isEditing ? "invisible" : ""
        )}>
          {label}
          {isEditing && label.endsWith('\n') && <br />}
      </div>

      {isEditing && (
        <textarea
          ref={textareaRef}
          value={label}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="col-start-1 row-start-1 w-full h-full resize-none overflow-hidden bg-transparent border-none outline-none text-center p-0"
          style={{ 
            fontSize: 'inherit',
            fontWeight: 'inherit',
            color: 'inherit'
          }}
        />
      )}
      
      {/* Right handles */}
      <CustomHandle type="source" position={Position.Right} id="right" />
      <CustomHandle type="target" position={Position.Right} id="right-target" />

      <CustomHandle type="source" position={Position.Bottom} id="bottom" />
    </div>
  );
});
