import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { file } from "astro/loaders";

const team = defineCollection({
	loader: file("src/data/team.json"),
	schema: ({ image }) =>
		z.object({
			name: z.string(),
			role: z.string(),
			email: z.email(),
			phone: z.string(),
			image: image(),
		}),
});

const testimonials = defineCollection({
	loader: file("./src/data/testimonials.json"),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			img: image(),
			author: z.string(),
			location: z.string(),
			hidden: z.boolean().default(false),
			starRating: z.number().min(1).max(5),
		}),
});

export const collections = { team, testimonials };
