import {
	createContext,
	type ReactNode,
	useContext,
	useLayoutEffect,
	useState,
} from "react";

interface NavbarOverlayContextValue {
	content: ReactNode | null;
	setContent: (content: ReactNode | null) => void;
}

const NavbarOverlayContext = createContext<NavbarOverlayContextValue | null>(
	null,
);

interface NavbarOverlayProviderProps {
	children: ReactNode;
}

export function NavbarOverlayProvider({
	children,
}: NavbarOverlayProviderProps) {
	const [content, setContent] = useState<ReactNode | null>(null);

	return (
		<NavbarOverlayContext.Provider value={{ content, setContent }}>
			{children}
		</NavbarOverlayContext.Provider>
	);
}

export function useNavbarOverlayContent(content: ReactNode | null) {
	const ctx = useContext(NavbarOverlayContext);

	useLayoutEffect(() => {
		if (!ctx) return;

		ctx.setContent(content);
		return () => {
			ctx.setContent(null);
		};
	}, [ctx, content]);
}

export function useNavbarOverlayContext() {
	const ctx = useContext(NavbarOverlayContext);
	if (!ctx) {
		throw new Error(
			"useNavbarOverlayContext must be used within NavbarOverlayProvider",
		);
	}
	return ctx;
}
