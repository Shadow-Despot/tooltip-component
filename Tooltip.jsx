import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./tooltip.css";

const Tooltip = ({ text, bgColor = "rgba(0, 0, 0, 0.85)", children }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="tooltip-container" 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="tooltip"
            style={{ background: bgColor }}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
          >
            {text}
            <div 
              className="tooltip-arrow" 
              style={{ borderTopColor: bgColor }}
            ></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;
