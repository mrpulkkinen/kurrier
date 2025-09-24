"use client";
import React, {
	useEffect,
	useRef,
	forwardRef,
	useImperativeHandle,
	useActionState,
	useState,
} from "react";
import { MessageEntity } from "@db";
import {
	TextEditor,
	TextEditorHandle,
} from "@/components/mailbox/default/editor/rich-text-editor";
import Form from "next/form";
import { sendMail } from "@/lib/actions/mailbox";
import type { FormState } from "@schema";
import { DynamicContextProvider } from "@/hooks/use-dynamic-context";
import { toast, Toaster } from "sonner";
import { useAppearance } from "@/components/providers/appearance-provider";

export type EmailEditorHandle = {
	focus: () => void;
	getElement: () => HTMLElement | null;
};

type Props = { onReady?: (el: HTMLElement) => void; message: MessageEntity };

const EmailEditor = forwardRef<EmailEditorHandle, Props>(
	({ onReady, message }, ref) => {
		const textEditorRef = useRef<TextEditorHandle>(null);

		useImperativeHandle(
			ref,
			() => ({
				focus: () => textEditorRef.current?.focus("end"),
				getElement: () => textEditorRef.current?.getElement() ?? null,
			}),
			[],
		);

		useEffect(() => {
			const el = textEditorRef.current?.getElement();
			if (el) onReady?.(el);
		}, [onReady]);

		const [formState, formAction, isPending] = useActionState<
			FormState,
			FormData
		>(sendMail, {});

		useEffect(() => {
			if (formState.error) {
				toast.error("Error", {
					description: formState.error,
				});
			} else if (formState.success) {
				toast.success("Success", {
					description: formState.success,
				});
			}
		}, [formState]);

		const { mode } = useAppearance();
		return (
			<>
				<Toaster theme={mode} expand={true} />
				<div className="mt-4" tabIndex={-1}>
					<DynamicContextProvider initialState={{ isPending }}>
						<Form action={formAction}>
							<input type={"hidden"} name={"messageId"} value={message.id} />
							<TextEditor name={"html"} ref={textEditorRef} message={message} />
						</Form>
					</DynamicContextProvider>
				</div>
			</>
		);
	},
);

EmailEditor.displayName = "EmailEditor";
export default EmailEditor;
