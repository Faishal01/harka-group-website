import type { EmblaCarouselType } from "embla-carousel";

export const addThumbBtnsClickHandlers = (emblaApiMain: EmblaCarouselType, emblaApiThumb: EmblaCarouselType) => {
	const slidesThumbs = emblaApiThumb.slideNodes();

	const scrollToIndex = slidesThumbs.map((_, index) => () => emblaApiMain.scrollTo(index));

	slidesThumbs.forEach((slideNode, index) => {
		slideNode.addEventListener("click", scrollToIndex[index], false);
	});

	return () => {
		slidesThumbs.forEach((slideNode, index) => {
			slideNode.removeEventListener("click", scrollToIndex[index], false);
		});
	};
};

export const addToggleThumbBtnsActive = (emblaApiMain: EmblaCarouselType, emblaApiThumb: EmblaCarouselType) => {
	const slidesThumbs = emblaApiThumb.slideNodes();

	const toggleThumbBtnsState = () => {
		emblaApiThumb.scrollTo(emblaApiMain.selectedScrollSnap());
		const previous = emblaApiMain.previousScrollSnap();
		const selected = emblaApiMain.selectedScrollSnap();
		slidesThumbs[previous]?.classList.remove("embla-thumbs__slide--selected");
		slidesThumbs[selected]?.classList.add("embla-thumbs__slide--selected");
	};

	emblaApiMain.on("select", toggleThumbBtnsState);
	emblaApiThumb.on("init", toggleThumbBtnsState);

	return () => {
		const selected = emblaApiMain.selectedScrollSnap();
		slidesThumbs[selected]?.classList.remove("embla-thumbs__slide--selected");
	};
};

const addTogglePrevNextBtnsActive = (emblaApi: EmblaCarouselType, prevBtn: HTMLElement, nextBtn: HTMLElement) => {
	const togglePrevNextBtnsState = () => {
		if (emblaApi.canScrollPrev()) prevBtn.removeAttribute("disabled");
		else prevBtn.setAttribute("disabled", "disabled");

		if (emblaApi.canScrollNext()) nextBtn.removeAttribute("disabled");
		else nextBtn.setAttribute("disabled", "disabled");
	};

	emblaApi
		.on("select", togglePrevNextBtnsState)
		.on("init", togglePrevNextBtnsState)
		.on("reInit", togglePrevNextBtnsState);

	return () => {
		prevBtn.removeAttribute("disabled");
		nextBtn.removeAttribute("disabled");
	};
};

export const addPrevNextBtnsClickHandlers = (emblaApi: EmblaCarouselType, prevBtn: HTMLElement, nextBtn: HTMLElement) => {
	const scrollPrev = () => {
		emblaApi.scrollPrev();
	};
	const scrollNext = () => {
		emblaApi.scrollNext();
	};
	prevBtn.addEventListener("click", scrollPrev, false);
	nextBtn.addEventListener("click", scrollNext, false);

	const removeTogglePrevNextBtnsActive = addTogglePrevNextBtnsActive(emblaApi, prevBtn, nextBtn);

	return () => {
		removeTogglePrevNextBtnsActive();
		prevBtn.removeEventListener("click", scrollPrev, false);
		nextBtn.removeEventListener("click", scrollNext, false);
	};
};
