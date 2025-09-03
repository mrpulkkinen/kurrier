import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formDataToJson(formData: FormData) {
	const data = {} as any;
	formData.forEach((value, key) => {
		if (data[key]) {
			data[key] = Array.isArray(data[key])
				? [...data[key], value]
				: [data[key], value];
		} else {
			data[key] = value;
		}
	});
	return data;
}
