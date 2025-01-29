declare module "react" {
    namespace JSX {
      interface IntrinsicElements {
        "my-element": {
          myElementProps: string;
        };
      }
      interface Element {
        "my-element": {
            myElementProps: string;
        }
      }
    }
}