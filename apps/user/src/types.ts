import type { CollectionEntry } from "astro:content";
import type { colorClasses } from "./components/CardGridAlt.astro";
import type { pillColors } from "./components/Pill.astro";
import type { cars } from "@harka/db";
export type Car = {
	id: string;
	data: typeof cars.$inferSelect;
};
export type Testimonial = CollectionEntry<"testimonials">;

// Components
export interface ClassNameProps {
	class?: string;
}

export interface ArticleProps {
	contain?: boolean;
}

export interface ButtonProps extends ClassNameProps {
	color?: string;
	href?: string;
	newtab?: boolean;
	As?: "a" | "button";
	type?: "button" | "submit" | "reset";
}

export interface CardGridAltProps {
	title: string;
	description: string;
	icon: string;
	href?: string;
	color: keyof typeof colorClasses;
}

export interface ContainerProps extends ClassNameProps {
	contain?: boolean;
}

export interface FaqProps extends ClassNameProps {
	items: {
		question: string;
		answer: string;
	}[];
}

export interface FilterBarMobileProps {
	params: [string, string][];
}

export interface GridProps {
	columns?: number;
}

export interface GridItemProps {
	span?: number;
	image?: ImageMetadata;
	imageAlt?: string;
	As?: "div" | "a";
	link?: string;
	xl?: boolean;
}

export interface HeroProps {
	invert?: boolean;
}

export interface PaginationProps {
	page: number;
	totalPages: number;
	searchParams: URLSearchParams;
}

export interface PillProps {
	color?: keyof typeof pillColors;
	title: string;
}

export interface PresetBarProps {
	params: [string, string][];
}

export interface SectionProps extends ClassNameProps {
	id?: string;
}

export interface ShowCarsProps {
	recent?: boolean;
	featured?: boolean;
	slugs?: string[];
	ui?: "list" | "grid";
}

export interface Stat {
	title: string;
	value: string;
	animateNumber?: boolean;
	animateFrom?: number;
}

export interface StatsProps {
	items: Stat[];
}

export interface WideImageProps extends ClassNameProps {
	image: ImageMetadata;
	alt: string;
}

export interface LoanCalculatorProps {
	price: number;
}

export interface CardPriceProps {
	data: {
		price: number;
		salePrice?: number;
	};
}

export interface PriceProps {
	properties: {
		price: number;
		salePrice?: number;
	};
}

export interface SliderProps {
	image: string | null;
	alt: string | null;
	gallery: { image: string; alt: string }[] | null;
	videoTour?: string | null;
}

export interface WidgetLoanProps {
	price: number;
}

export interface TestimonialProps {
	id?: string;
}

// Menus
export interface MainMenuItem {
	id: string;
	label: string;
	url?: string;
	submenu?: MainMenuItem[];
	isExternal?: boolean;
	icon?: string;
}

export interface MenuNavigation {
	prettyName: string;
	items: {
		name: string;
		url: string;
	}[];
}
