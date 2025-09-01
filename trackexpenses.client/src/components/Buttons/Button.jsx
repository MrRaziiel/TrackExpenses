import React from "react";
import PropTypes from "prop-types";
import { useTheme } from "../../styles/Theme/Theme";

const Button = ({
  children,
  type = "button",
  onClick,
  disabled,
  size = "md", // sm, md, lg
  variant = "primary", // primary, secondary, danger
  fullWidth = true, // controla se ocupa toda a largura
  className = "",
}) => {
  const { theme } = useTheme();

  const sizes = {
    sm: "h-10 text-sm px-4",
    md: "h-12 text-base px-6", // altura consistente com Login
    lg: "h-14 text-lg px-8",
  };

  const variants = {
    primary: `
      text-white font-medium shadow-lg hover:shadow-xl 
      transform hover:-translate-y-0.5 transition-all duration-200
    `,
    secondary: `
      bg-gray-200 text-gray-800 hover:bg-gray-300
    `,
    danger: `
      bg-red-600 text-white hover:bg-red-700
    `,
  };

  // gradiente azul (como no Login)
  const backgroundStyle =
    variant === "primary"
      ? {
          background: `linear-gradient(135deg, ${theme?.colors?.primary?.main}, ${theme?.colors?.primary?.dark})`,
        }
      : {};

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${fullWidth ? "w-full" : "inline-flex"} 
        rounded-xl 
        ${sizes[size]} 
        ${variants[variant]} 
        ${className} 
        disabled:opacity-70
      `}
      style={backgroundStyle}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  type: PropTypes.string,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  variant: PropTypes.oneOf(["primary", "secondary", "danger"]),
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
};

export default Button;
