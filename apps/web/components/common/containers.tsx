type ContainerVariant = "wide" | "medium" | "narrow";

export function Container({
	children,
	variant = "medium",
}: {
	children: React.ReactNode;
	variant?: ContainerVariant;
}) {
	const base = "mx-auto px-4 sm:px-6 lg:px-8";

	const variants: Record<ContainerVariant, string> = {
		wide: "max-w-7xl", // stays wide always
		medium: "max-w-3xl lg:max-w-5xl", // medium, grows wider on lg+
		narrow: "max-w-xl lg:max-w-3xl", // narrow, grows on lg+
	};

	return <div className={`${base} ${variants[variant]}`}>{children}</div>;
}

// export function ContainerOne({ children }: { children: React.ReactNode }) {
//     return (
//         <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
//             {children}
//         </div>
//     );
// }
//
// export function ContainerTwo({ children }: { children: React.ReactNode }) {
//     return (
//         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
//             {children}
//         </div>
//     );
// }
//
// export function ContainerThree({ children }: { children: React.ReactNode }) {
//     return (
//         <div className="container mx-auto sm:px-6 lg:px-8">
//             {children}
//         </div>
//     );
// }
//
//
// export function ContainerFour({ children }: { children: React.ReactNode }) {
//     return (
//         <div className="container mx-auto px-4 sm:px-6 lg:px-8">
//             {children}
//         </div>
//     );
// }
//
//
// export function ContainerFive({ children }: { children: React.ReactNode }) {
//     return (
//         <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
//             <div className="mx-auto max-w-3xl">
//                 {children}
//             </div>
//         </div>
//     );
// }
