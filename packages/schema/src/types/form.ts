import { ReactNode } from "react";

export type SelectOption = { label: string; value: string };

export type FieldKind = "input" | "textarea" | "select" | "custom";

export type FieldConfig = {
	kind?: FieldKind;
	name?: string;
	label?: ReactNode;
	labelSuffix?: ReactNode;
	wrapperClasses?: string;
	props?: any;
	options?: SelectOption[];
	el?: ReactNode;
	prefix?: ReactNode;
	bottomStartPrefix?: ReactNode;
	bottomEndSuffix?: ReactNode;
};

export type BaseFormProps = {
	fields: FieldConfig[];
	action: any;
	onChange?: React.FormEventHandler<HTMLFormElement>;
	onSuccess?: (data: FormData | any) => void;
	formWrapperClasses?: string;
	errorClasses?: string;
};

export type FormState<TData = unknown> = {
	success?: boolean;
	data?: TData;
	error?: string;
	errors?: Record<string, string[]>;
	message?: string;
};

export type GenericResult<T = void> = {
	data?: T;
	error?: string;
	success?: boolean;
	message?: string;
};
