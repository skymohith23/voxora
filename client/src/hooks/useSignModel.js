import { useEffect } from "react";

export default function useSignModel() {
  useEffect(() => {
    console.log("Model will be loaded here.");
  }, []);

  return {
    detectSign: () => {
      console.log("Sign detection logic will go here.");
    },
  };
}
