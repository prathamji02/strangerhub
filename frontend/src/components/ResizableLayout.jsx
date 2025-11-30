import React, { useState, useRef, useEffect } from 'react';

const ResizableLayout = ({ left, center, right, orientation = 'horizontal' }) => {
    const [size1, setSize1] = useState(25); // Percentage (Width or Height)
    const [size2, setSize2] = useState(50); // Percentage
    // Size3 is 100 - size1 - size2

    const containerRef = useRef(null);
    const isDragging1 = useRef(false);
    const isDragging2 = useRef(false);

    const handleStart1 = (e) => {
        isDragging1.current = true;
        addListeners();
    };

    const handleStart2 = (e) => {
        isDragging2.current = true;
        addListeners();
    };

    const addListeners = () => {
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchmove', handleMove);
        document.addEventListener('touchend', handleEnd);
    };

    const removeListeners = () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleEnd);
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', handleEnd);
    };

    const handleMove = (e) => {
        if (!containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();

        let clientPos;
        let containerSize;
        let offset;

        if (orientation === 'horizontal') {
            clientPos = e.touches ? e.touches[0].clientX : e.clientX;
            containerSize = containerRect.width;
            offset = containerRect.left;
        } else {
            clientPos = e.touches ? e.touches[0].clientY : e.clientY;
            containerSize = containerRect.height;
            offset = containerRect.top;
        }

        // Prevent scrolling on mobile while dragging
        if (e.touches && (isDragging1.current || isDragging2.current)) {
            e.preventDefault();
        }

        const posPercentage = ((clientPos - offset) / containerSize) * 100;

        if (isDragging1.current) {
            // Moving Divider 1 (between Pane 1 and Pane 2)
            // posPercentage is the new size of Pane 1
            const currentSize3 = 100 - size1 - size2;
            const newSize1 = posPercentage;
            const newSize2 = 100 - newSize1 - currentSize3;

            if (newSize1 > 10 && newSize2 > 10) {
                setSize1(newSize1);
                setSize2(newSize2);
            }
        } else if (isDragging2.current) {
            // Moving Divider 2 (between Pane 2 and Pane 3)
            // posPercentage is (Size1 + Size2)
            const newSize2 = posPercentage - size1;
            const newSize3 = 100 - size1 - newSize2;

            if (newSize2 > 10 && newSize3 > 10) {
                setSize2(newSize2);
            }
        }
    };

    const handleEnd = () => {
        isDragging1.current = false;
        isDragging2.current = false;
        removeListeners();
    };

    const isHorizontal = orientation === 'horizontal';
    const dim = isHorizontal ? 'width' : 'height';
    const cursor = isHorizontal ? 'cursor-col-resize' : 'cursor-row-resize';
    const dividerClass = `absolute z-50 bg-gray-600 hover:bg-blue-500 transition-colors flex items-center justify-center ${isHorizontal ? 'top-0 right-0 w-4 h-full cursor-col-resize' : 'bottom-0 left-0 w-full h-4 cursor-row-resize'}`;
    // Visual indicator inside the large touch area
    const indicatorClass = `bg-gray-400 rounded-full ${isHorizontal ? 'w-1 h-8' : 'h-1 w-8'}`;

    return (
        <div ref={containerRef} className={`flex w-full h-full overflow-hidden select-none ${isHorizontal ? 'flex-row' : 'flex-col'}`}>
            {/* Pane 1 */}
            <div style={{ [dim]: `${size1}%` }} className="relative">
                {left}
                {/* Divider 1 */}
                <div
                    onMouseDown={handleStart1}
                    onTouchStart={handleStart1}
                    className={`${dividerClass} ${cursor}`}
                    style={{ touchAction: 'none' }}
                >
                    <span className={indicatorClass}></span>
                </div>
            </div>

            {/* Pane 2 */}
            <div style={{ [dim]: `${size2}%` }} className="relative">
                {center}
                {/* Divider 2 */}
                <div
                    onMouseDown={handleStart2}
                    onTouchStart={handleStart2}
                    className={`${dividerClass} ${cursor}`}
                    style={{ touchAction: 'none' }}
                >
                    <span className={indicatorClass}></span>
                </div>
            </div>

            {/* Pane 3 */}
            <div style={{ [dim]: `${100 - size1 - size2}%` }}>
                {right}
            </div>
        </div>
    );
};

export default ResizableLayout;
