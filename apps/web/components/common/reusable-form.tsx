"use client";

import * as React from "react";
import {
	ComponentProps,
	useActionState,
	useEffect,
	useMemo,
	useRef,
} from "react";
import Form from "next/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { BaseFormProps, FormState, SelectOption } from "@schema";

export type ReusableFormProps = BaseFormProps & {
	submitButtonProps?: SubmitButtonProps;
};

type SubmitButtonProps = {
	submitLabel?: string;
	inlineSubmit?: boolean; // if true, renders inside grid
	wrapperClasses?: string;
	className?: string;
	fullWidth?: boolean;
	// extra props to pass through to <Button>
	buttonProps?: ComponentProps<typeof Button>;
};

/** shadcn Select that also submits to server actions via a hidden input */
function SelectField({
	name,
	placeholder,
	options = [],
	defaultValue,
	disabled,
	className,
}: {
	name: string;
	placeholder?: string;
	options?: SelectOption[];
	defaultValue?: string;
	disabled?: boolean;
	className?: string;
}) {
	const [val, setVal] = React.useState(defaultValue ?? "");
	return (
		<>
			{/* hidden input makes it part of FormData on submit */}
			<input type="hidden" name={name} value={val} />
			<Select
				defaultValue={defaultValue}
				onValueChange={setVal}
				disabled={disabled}
			>
				<SelectTrigger className={className}>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{options.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</>
	);
}

export function ReusableForm({
	fields,
	action,
	onChange,
	onSuccess,
	submitButtonProps = {
		submitLabel: "Submit",
		wrapperClasses: "mt-8",
		fullWidth: true,
	},
	formWrapperClasses = "grid grid-cols-12 gap-4",
	errorClasses = "text-red-500",
}: ReusableFormProps) {
	// const [formState, formAction, isPending] = useActionState<FormState>(action, {});
	const [formState, formAction, isPending] = useActionState<
		FormState,
		FormData
	>(action, {});
	const formRef = useRef<HTMLFormElement>(null);

	const errors = useMemo(() => formState?.errors || {}, [formState]);
	const error = useMemo(() => formState?.error || null, [formState]);
	const message = useMemo(() => formState?.message || null, [formState]);

	// optional success callback (works nicely when your action returns { success: true, data })
	useEffect(() => {
		if (!isPending && formState?.success && onSuccess) {
			onSuccess(formState.data);
		}
	}, [isPending, formState?.success, onSuccess, formState?.data]);

	const SubmitButton = (
		<Button
			type="submit"
			disabled={isPending}
			className={`${submitButtonProps?.fullWidth ? "w-full" : ""} ${submitButtonProps?.className ?? ""}`}
			{...(submitButtonProps?.buttonProps || {})}
		>
			<div className="flex justify-center gap-2.5 items-center">
				{submitButtonProps?.submitLabel ?? "Submit"}
			</div>
		</Button>
	);

	return (
		<Form ref={formRef} action={formAction} onChange={onChange ?? undefined}>
			<div className={formWrapperClasses}>
				{fields.map((f, idx) => {
					const {
						kind = "input",
						name,
						label,
						labelSuffix,
						props = {},
						options = [],
						wrapperClasses = "col-span-12",
						el,
						prefix,
						bottomStartPrefix,
						bottomEndSuffix,
					} = f;

					return (
						<div key={idx} className={wrapperClasses}>
							{el ? (
								el
							) : props?.type === "hidden" ? (
								// hidden input
								<Input name={name!} {...props} />
							) : (
								<>
									{label && (
										<Label
											htmlFor={name}
											className="flex justify-between font-medium"
										>
											<div className="flex justify-start items-baseline">
												{label} {props?.required && <span>*</span>}
											</div>
											{labelSuffix}
										</Label>
									)}
									<div className="mt-2" />

									{kind === "select" ? (
										<SelectField
											name={name!}
											placeholder={props?.placeholder}
											options={options}
											defaultValue={props?.defaultValue}
											disabled={props?.disabled}
											className={props?.className}
										/>
									) : kind === "textarea" ? (
										<Textarea name={name!} {...props} />
									) : kind === "input" ? (
										<>
											{prefix ? (
												<div className="flex gap-2 items-center">
													{prefix}
													<Input name={name!} {...props} />
												</div>
											) : (
												<>
													<Input name={name!} {...props} />
													{bottomStartPrefix && (
														<div className="mt-2 flex justify-start">
															{bottomStartPrefix}
														</div>
													)}
													{bottomEndSuffix && (
														<div className="mt-2 flex justify-end">
															{bottomEndSuffix}
														</div>
													)}
												</>
											)}
										</>
									) : // "custom" kind: you can pass f.el instead for full control
									null}

									{name && errors?.[name] && (
										<span className={`${errorClasses} text-sm`}>
											{errors[name][0]}
										</span>
									)}
								</>
							)}
						</div>
					);
				})}

				{submitButtonProps?.inlineSubmit && (
					<div className="flex flex-grow items-center">
						{submitButtonProps.wrapperClasses ? (
							<div className={submitButtonProps.wrapperClasses}>
								{SubmitButton}
							</div>
						) : (
							SubmitButton
						)}
					</div>
				)}
			</div>

			{error && (
				<div className="flex justify-center mt-3 -mb-4 bg-red-50 p-2 rounded">
					<span className={`${errorClasses} text-sm`}>Error: {error}</span>
				</div>
			)}

			{message && (
				<div className="flex justify-center mt-3 -mb-4 bg-green-200 p-2 rounded text-center">
					<span className="text-sm">{message}</span>
				</div>
			)}

			{!submitButtonProps?.inlineSubmit && (
				<>
					{submitButtonProps?.wrapperClasses ? (
						<div className={submitButtonProps.wrapperClasses}>
							{SubmitButton}
						</div>
					) : (
						SubmitButton
					)}
				</>
			)}
		</Form>
	);
}
