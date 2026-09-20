import type { CollectionEntry } from "astro:content";
import type { Car as DbCar } from "@harka/db";
export type Car = DbCar;

export const colorClasses = {
	brand: "bg-red-700 text-white",
	black: "bg-gray-800 text-white",
	white: "bg-white text-gray-800",
	primary: "bg-red-50 text-red-700",
	green: "bg-green-50 text-green-700",
	blue: "bg-blue-50 text-blue-700",
	purple: "bg-purple-50 text-purple-700",
	red: "bg-red-50 text-red-700",
	orange: "bg-orange-50 text-orange-700",
};

export const pillColors = {
	indigo: "bg-indigo-50 text-indigo-800 ring-1 ring-indigo-800/10",
	blue: "bg-blue-50 text-blue-800 ring-1 ring-blue-800/10",
	green: "bg-green-50 text-green-800 ring-1 ring-green-800/10",
	red: "bg-red-50 text-red-800 ring-1 ring-red-800/10",
	primary: "bg-red-50 text-red-800 ring-1 ring-red-800/10",
	purple: "bg-purple-50 text-purple-800 ring-1 ring-purple-800/10",
	pink: "bg-pink-50 text-pink-800 ring-1 ring-pink-800/10",
	gray: "bg-gray-50 text-gray-800 ring-1 ring-gray-800/10",
	black: "bg-black text-white ring-1 ring-white",
	white: "bg-white text-black ring-1 ring-black",
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
	alt?: string;
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

export interface SliderProps {
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
