import React, { useState, useEffect } from 'react';

const CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>/?~';

export const EncryptedText = ({ 
  text, 
  encryptedClassName = '', 
  revealedClassName = '', 
  revealDelayMs = 50 
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    let iteration = 0;
    let maxIterations = text.length;
    
    // Initial scramble
    setDisplayText(text.split('').map(() => CHARS[Math.floor(Math.random() * CHARS.length)]).join(''));

    const interval = setInterval(() => {
      setDisplayText((currentText) => 
        text.split('').map((char, index) => {
          if (char === ' ') return ' ';
          if (index < iteration) {
            return char;
          }
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        }).join('')
      );

      if (iteration >= maxIterations) {
        clearInterval(interval);
        setIsRevealed(true);
      }
      
      iteration += 1; // Faster character reveal
    }, revealDelayMs);

    return () => clearInterval(interval);
  }, [text, revealDelayMs]);

  return (
    <span className={isRevealed ? revealedClassName : encryptedClassName}>
      {displayText}
    </span>
  );
};

