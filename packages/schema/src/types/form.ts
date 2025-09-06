import { ReactNode } from "react";

export type SelectOption = { label: string; value: string };

export type FieldKind = "input" | "textarea" | "select" | "custom";

export type FieldConfig = {
	kind?: FieldKind; // default: "input"
	name?: string; // not required for custom
	label?: ReactNode;
	labelSuffix?: ReactNode;
	wrapperClasses?: string; // tailwind grid span etc.
	props?: any; // forwarded to underlying component
	options?: SelectOption[]; // for select
	el?: ReactNode; // render custom element instead of built-ins
	prefix?: ReactNode; // inline prefix
	bottomStartPrefix?: ReactNode;
	bottomEndSuffix?: ReactNode;
};

export type BaseFormProps = {
	fields: FieldConfig[];
	action: any; // server action used with useActionState
	onChange?: React.FormEventHandler<HTMLFormElement>;
	onSuccess?: (data: FormData | any) => void;
	formWrapperClasses?: string;
	errorClasses?: string;
};

export type FormState<TData = unknown> = {
	success?: boolean;
	data?: TData;
	error?: string; // global error (non-field-specific)
	errors?: Record<string, string[]>; // field-level errors (by field name)
	message?: string; // optional friendly message
};
