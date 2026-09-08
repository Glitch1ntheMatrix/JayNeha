import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FBF4EA",
        creamLight: "#FDF7EE",
        creamCard: "#FFFCF6",
        parchment: "#F5EADA",
        border: "#E7D6BC",
        borderInput: "#C9AE80",
        ink: "#2E211A",
        inkSoft: "#3B2B21",
        inkBody: "#423026",
        inkMuted: "#372A20",
        maroon: "#7A0C22",
        maroonHover: "#9E2233",
        maroonDeep: "#5C0A1B",
        gold: "#C08A2E",
        goldLight: "#D8BE8C",
        brown: "#6B3D08",
        errorBg: "#FBEBE6",
        errorText: "#7A2020",
        answeredGreen: "#4E7A3A",
      },
      fontFamily: {
        display: ["'Marcellus'", "serif"],
        body: ["'Cormorant Garamond'", "serif"],
        ui: ["'Jost'", "system-ui", "sans-serif"],
      },
      keyframes: {
        njFade: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "none" },
        },
        njSeal: {
          "0%": { opacity: "1", transform: "translate(-50%,-50%) scale(1) rotate(0deg)" },
          "30%": { opacity: "1", transform: "translate(-50%,-50%) scale(1.16) rotate(-6deg)" },
          "62%": { opacity: ".85", transform: "translate(-50%,-58%) scale(.9) rotate(-15deg)" },
          "100%": { opacity: "0", transform: "translate(-50%,-80%) scale(.58) rotate(-30deg)" },
        },
      },
      animation: {
        njFade: "njFade .7s ease both",
        njSeal: "njSeal .34s cubic-bezier(.4,0,.4,1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
