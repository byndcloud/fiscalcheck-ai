import { cn } from "@/lib/utils";
import { describe, expect, it } from "vitest";

describe("smoke", () => {
	it("environment is wired", () => {
		expect(1 + 1).toBe(2);
	});

	it("cn() helper merges tailwind classes", () => {
		expect(cn("px-2", "px-4")).toBe("px-4");
		expect(cn("bg-red-500", null, false, "text-white")).toBe(
			"bg-red-500 text-white",
		);
	});
});
