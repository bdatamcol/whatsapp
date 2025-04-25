// Input.tsx
import React from 'react';

const Input = ({ ...props }) => {
    return (
        <input
            {...props}
            className="border border-gray-300 p-2 rounded-md w-full"
        />
    );
};

export default Input;
