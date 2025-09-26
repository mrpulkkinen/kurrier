"use client";
import React, {
	createContext,
	useContext,
	useMemo,
	useState,
	useEffect,
	type ReactNode,
} from "react";

type Dict = Record<string, unknown>;

type DynamicContextType<T extends Dict> = {
	state: T;
	setState: React.Dispatch<React.SetStateAction<T>>;
};

const Ctx = createContext<DynamicContextType<any> | null>(null);

/** Generic Provider – you specify T at the call site */
export function DynamicContextProvider<T extends Dict>({
	children,
	initialState,
}: {
	children: ReactNode;
	initialState: T;
}) {
	const [state, setState] = useState<T>(initialState);

	// Sync if initialState changes (e.g. on route changes / SSR).
	useEffect(() => {
		setState((prev) => (prev === initialState ? prev : initialState));
	}, [initialState]);

	const value = useMemo(() => ({ state, setState }), [state]);

	return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Generic hook – ask for T where you consume it */
export function useDynamicContext<T extends Dict>(): DynamicContextType<T> {
	const ctx = useContext(Ctx);
	if (!ctx) {
		throw new Error(
			"useDynamicContext must be used within a DynamicContextProvider",
		);
	}
	return ctx as DynamicContextType<T>;
}

// 'use client';
// import React, {
//     createContext, useContext, useState, useEffect, useMemo, ReactNode,
// } from 'react';
//
// type Dict = Record<string, any>;
//
// type DynamicContextType = {
//     state: Dict;
//     setState: React.Dispatch<React.SetStateAction<Dict>>;
// };
//
// export const DynamicContext = createContext<DynamicContextType | null>(null);
//
// type ProviderProps = {
//     children: ReactNode;
//     initialState: Dict;
// };
//
// export const DynamicContextProvider: React.FC<ProviderProps> = ({ children, initialState }) => {
//     const [state, setState] = useState<Dict>(initialState);
//
//     // On route changes (new SSR payload), replace the snapshot.
//     useEffect(() => {
//         // Only replace if the object identity actually changed.
//         setState(prev => (prev === initialState ? prev : initialState));
//     }, [initialState]);
//
//     // Memoize so consumers only re-render when `state` changes.
//     const value = useMemo<DynamicContextType>(() => ({ state, setState }), [state]);
//
//     return <DynamicContext.Provider value={value}>{children}</DynamicContext.Provider>;
// };
//
// export function useDynamicContext(): DynamicContextType {
//     const ctx = useContext(DynamicContext);
//     if (!ctx) throw new Error('useDynamicContext must be used within a DynamicContextProvider');
//     return ctx;
// }
