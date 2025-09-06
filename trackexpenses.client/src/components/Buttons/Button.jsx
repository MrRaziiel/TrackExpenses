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
  fullWidth = false, // se true ocupa 100%, senão usa tamanho fixo
  className = "",
}) => {
  const { theme } = useTheme();

  // largura e altura fixas -> não dependem do texto
  const sizes = {
    sm: "h-10 w-28 text-sm",   // ~112px
    md: "h-12 w-36 text-base", // ~144px
    lg: "h-14 w-44 text-lg",   // ~176px
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
        inline-flex items-center justify-center
        rounded-xl
        ${fullWidth ? "w-full" : sizes[size]}
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
