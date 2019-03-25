import React from 'react';
import cn from '../utils/cn';

function Button({ children, disabled, isDown, onClick }) {
  return (
    <button
      disabled={disabled}
      className={cn(
        'button-reset flex-none input-reset db pa0 bn border-box lh-solid w4 h2 outline-0 pointer',
        disabled ? 'o-50' : null,
        isDown ? 'bg-dark-gray light-gray b--near-black button-border-top' : null,
        !isDown ? 'bg-gold dark-gray b--orange button-border-bottom' : null
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default Button;
