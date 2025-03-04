import styled from "styled-components";

export const StyledButton = styled.button`
  background-color: ${(props) => props.theme.colors.primary};
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: 0.3s;

  &:hover {
    background-color: ${(props) => props.theme.colors.highlight};
  }
`;