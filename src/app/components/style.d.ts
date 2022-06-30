import "styled-components";

declare module "styled-components" {
  export interface DefaultTheme {
    mode: {
      mainBackground: string;
      primaryText: string;
      secondaryText: string;
      disable: string;
      border: string;
      divider: string;
      background: string;
      tableHeader: string;
      themeIcon: string;
      blue1: string;
      blue2: string;
      blue3: string;
      green: string;
      gray: string;
    };
    fontSizes: {
      xsm: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    fontWeights: {
      extraBold: number;
      bold: number;
      semiBold: number;
      regular: number;
    };
  }
}