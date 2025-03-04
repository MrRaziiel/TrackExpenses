import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  body {
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fonts.main};
  }

  h1, h2, h3, h4, h5, h6 {
    color: ${({ theme }) => theme.colors.text};
  }

  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
  }

  button {
    font-weight: bold;
    cursor: pointer;
  }
`;

export default GlobalStyle;