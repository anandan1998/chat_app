import { create } from "zustand";

export const backStore = create((set) => ({

    chatlist: true,

    setChatlist: (value) => {

        return set({ chatlist: value });
    }
}));