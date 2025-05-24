import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      typography: (theme) => ({
        DEFAULT: {
          css: {
            maxWidth: "65ch",
            color: theme("colors.gray.700"),
            lineHeight: "1.75",
            fontSize: "1.125rem",
            '[class~="lead"]': {
              fontSize: "1.25rem",
              lineHeight: "1.6",
            },
            p: {
              marginTop: "1.25em",
              marginBottom: "1.25em",
              fontSize: "1.125rem",
              lineHeight: "1.75",
            },
            "h1, h2, h3, h4, h5, h6": {
              fontWeight: "600",
              lineHeight: "1.25",
              marginTop: "2em",
              marginBottom: "1em",
            },
            h1: {
              fontSize: "2.25rem",
              fontWeight: "700",
              marginTop: "0",
              marginBottom: "0.8888889em",
            },
            h2: {
              fontSize: "1.875rem",
              fontWeight: "600",
              marginTop: "1.5555556em",
              marginBottom: "0.8888889em",
            },
            h3: {
              fontSize: "1.5rem",
              fontWeight: "600",
              marginTop: "1.6em",
              marginBottom: "0.6em",
            },
            h4: {
              fontSize: "1.25rem",
              fontWeight: "600",
              marginTop: "1.5em",
              marginBottom: "0.5em",
            },
            a: {
              color: theme("colors.green.600"),
              textDecoration: "underline",
              textUnderlineOffset: "2px",
              "&:hover": {
                color: theme("colors.green.700"),
              },
            },
            blockquote: {
              fontStyle: "italic",
              fontSize: "1.125rem",
              fontWeight: "500",
              borderLeftWidth: "4px",
              borderLeftColor: theme("colors.gray.200"),
              paddingLeft: "1em",
              marginTop: "1.6em",
              marginBottom: "1.6em",
              quotes: '"\\201C""\\201D""\\2018""\\2019"',
            },
            "blockquote p:first-of-type::before": {
              content: "open-quote",
            },
            "blockquote p:last-of-type::after": {
              content: "close-quote",
            },
            code: {
              color: theme("colors.gray.900"),
              backgroundColor: theme("colors.gray.100"),
              paddingLeft: "4px",
              paddingRight: "4px",
              paddingTop: "2px",
              paddingBottom: "2px",
              borderRadius: "0.25rem",
              fontSize: "0.875em",
            },
            "code::before": {
              content: '""',
            },
            "code::after": {
              content: '""',
            },
            pre: {
              color: theme("colors.gray.50"),
              backgroundColor: theme("colors.gray.800"),
              overflowX: "auto",
              fontSize: "0.875em",
              lineHeight: "1.7142857",
              marginTop: "1.7142857em",
              marginBottom: "1.7142857em",
              borderRadius: "0.375rem",
              paddingTop: "0.8571429em",
              paddingRight: "1.1428571em",
              paddingBottom: "0.8571429em",
              paddingLeft: "1.1428571em",
            },
            "pre code": {
              backgroundColor: "transparent",
              borderWidth: "0",
              borderRadius: "0",
              padding: "0",
              fontWeight: "400",
              color: "inherit",
              fontSize: "inherit",
              fontFamily: "inherit",
              lineHeight: "inherit",
            },
            "pre code::before": {
              content: "none",
            },
            "pre code::after": {
              content: "none",
            },
            ul: {
              paddingLeft: "1.625em",
              marginTop: "1.25em",
              marginBottom: "1.25em",
            },
            ol: {
              paddingLeft: "1.625em",
              marginTop: "1.25em",
              marginBottom: "1.25em",
            },
            li: {
              marginTop: "0.5em",
              marginBottom: "0.5em",
            },
            "ul > li": {
              paddingLeft: "0.375em",
            },
            "ol > li": {
              paddingLeft: "0.375em",
            },
            img: {
              marginTop: "2em",
              marginBottom: "2em",
              borderRadius: "0.5rem",
            },
            figure: {
              marginTop: "2em",
              marginBottom: "2em",
            },
            "figure > *": {
              marginTop: "0",
              marginBottom: "0",
            },
            figcaption: {
              color: theme("colors.gray.500"),
              fontSize: "0.875em",
              lineHeight: "1.4285714",
              marginTop: "0.8571429em",
              textAlign: "center",
            },
          },
        },
        lg: {
          css: {
            fontSize: "1.125rem",
            lineHeight: "1.7777778",
            p: {
              marginTop: "1.3333333em",
              marginBottom: "1.3333333em",
              fontSize: "1.125rem",
              lineHeight: "1.7777778",
            },
            '[class~="lead"]': {
              fontSize: "1.2222222em",
              lineHeight: "1.4545455",
            },
            blockquote: {
              marginTop: "1.6666667em",
              marginBottom: "1.6666667em",
              paddingLeft: "1em",
            },
            h1: {
              fontSize: "2.6666667em",
              marginTop: "0",
              marginBottom: "0.8333333em",
              lineHeight: "1",
            },
            h2: {
              fontSize: "2em",
              marginTop: "1.8333333em",
              marginBottom: "1.1666667em",
              lineHeight: "1.3333333",
            },
            h3: {
              fontSize: "1.5em",
              marginTop: "1.6666667em",
              marginBottom: "0.6666667em",
              lineHeight: "1.3333333",
            },
            h4: {
              marginTop: "1.7777778em",
              marginBottom: "0.4444444em",
              lineHeight: "1.5555556",
            },
            img: {
              marginTop: "1.7777778em",
              marginBottom: "1.7777778em",
            },
            figure: {
              marginTop: "1.7777778em",
              marginBottom: "1.7777778em",
            },
            figcaption: {
              fontSize: "0.8888889em",
              lineHeight: "1.5",
              marginTop: "1em",
            },
            code: {
              fontSize: "0.8888889em",
            },
            "h2 code": {
              fontSize: "0.875em",
            },
            "h3 code": {
              fontSize: "0.9em",
            },
            pre: {
              fontSize: "0.8888889em",
              lineHeight: "1.75",
              marginTop: "2em",
              marginBottom: "2em",
              borderRadius: "0.375rem",
              paddingTop: "1em",
              paddingRight: "1.5em",
              paddingBottom: "1em",
              paddingLeft: "1.5em",
            },
            ol: {
              paddingLeft: "1.5555556em",
              marginTop: "1.3333333em",
              marginBottom: "1.3333333em",
            },
            ul: {
              paddingLeft: "1.5555556em",
              marginTop: "1.3333333em",
              marginBottom: "1.3333333em",
            },
            li: {
              marginTop: "0.6666667em",
              marginBottom: "0.6666667em",
            },
            "ol > li": {
              paddingLeft: "0.4444444em",
            },
            "ul > li": {
              paddingLeft: "0.4444444em",
            },
          },
        },
      }),
    },
  },
  plugins: [typography],
};
