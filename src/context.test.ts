import * as assert from "node:assert";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { ContextError, ContextManager, type Context } from "./context.js";

describe("ContextManager", () => {
    describe("run", () => {
        it("should return context with sync functions", () => {
            const ctx: Context = {
                reqId: randomUUID(),
                traceId: randomUUID(),
            };
            const ctxManager = new ContextManager();

            function assertContext() {
                assert.strict.deepStrictEqual(ctxManager.get(), ctx);
            }

            function c() {
                assertContext();
            }
            function b() {
                assertContext();
                c();
            }
            function a() {
                assertContext();
                b();
            }

            ctxManager.run(a, ctx);
        });

        it("should return context with async callbacks", () => {
            const ctx: Context = {
                reqId: randomUUID(),
                traceId: randomUUID(),
            };
            const ctxManager = new ContextManager();

            function assertContext() {
                assert.strict.deepStrictEqual(ctxManager.get(), ctx);
            }

            function c() {
                setTimeout(() => assertContext());
            }
            function b() {
                setImmediate(() => c());
            }
            function a() {
                process.nextTick(() => b());
            }

            ctxManager.run(a, ctx);
        });

        it("should return context with promises", async () => {
            const ctx: Context = {
                reqId: randomUUID(),
                traceId: randomUUID(),
            };
            const ctxManager = new ContextManager();

            function assertContext() {
                assert.strict.deepStrictEqual(ctxManager.get(), ctx);
            }

            function c() {
                assertContext();
                return Promise.resolve();
            }
            async function b() {
                await c();
                assertContext();
            }
            async function a() {
                await b();
                assertContext();
            }

            await ctxManager.run(a, ctx);
        });
    });

    describe("get", () => {
        it("should return provided context", () => {
            const ctx: Context = {
                reqId: randomUUID(),
                traceId: randomUUID(),
            };
            const ctxManager = new ContextManager();

            ctxManager.run(() => {
                assert.strict.deepStrictEqual(ctxManager.get(), ctx);
            }, ctx);
        });

        it("should return default context if context is not provided", () => {
            const ctxManager = new ContextManager();
            ctxManager.run(() => {
                assert.strict.deepStrictEqual(ctxManager.get(), {});
            });
        });

        it("should return undefined if context is not initialized", () => {
            const ctxManager = new ContextManager();
            assert.strict.equal(ctxManager.get(), undefined);
        });
    });

    describe("getOrFail", () => {
        it("should return provided context", () => {
            const ctx: Context = {
                reqId: randomUUID(),
                traceId: randomUUID(),
            };
            const ctxManager = new ContextManager();

            ctxManager.run(() => {
                assert.strict.deepStrictEqual(ctxManager.get(), ctx);
            }, ctx);
        });

        it("should return default context if context is not provided", () => {
            const ctxManager = new ContextManager();
            ctxManager.run(() => {
                assert.strict.deepStrictEqual(ctxManager.get(), {});
            });
        });

        it("should throw error if context is not initialized", () => {
            const ctxManager = new ContextManager();
            assert.strict.throws(() => ctxManager.getOrFail(), ContextError);
        });
    });

    describe("getByKey", () => {
        it("should return context property", () => {
            const ctx: Context = {
                reqId: randomUUID(),
                traceId: randomUUID(),
            };
            const ctxManager = new ContextManager();

            ctxManager.run(() => {
                assert.strict.strictEqual(
                    ctxManager.getByKey("reqId"),
                    ctx.reqId,
                );
            }, ctx);
        });

        it("should return undefined if context is not initialized", () => {
            const ctxManager = new ContextManager();
            assert.strict.equal(ctxManager.getByKey("reqId"), undefined);
        });

        it("should return undefined if context does not have key", () => {
            const ctx: Partial<Context> = {};
            const ctxManager = new ContextManager();

            ctxManager.run(() => {
                assert.strict.equal(ctxManager.getByKey("reqId"), undefined);
            }, ctx);
        });
    });

    describe("getByKeyOrFail", () => {
        it("should return context property", () => {
            const ctx: Context = {
                reqId: randomUUID(),
                traceId: randomUUID(),
            };
            const ctxManager = new ContextManager();

            ctxManager.run(() => {
                assert.strict.strictEqual(
                    ctxManager.getByKey("traceId"),
                    ctx.traceId,
                );
            }, ctx);
        });

        it("should throw error if context is not initialized", () => {
            const ctxManager = new ContextManager();
            assert.strict.throws(
                () => ctxManager.getByKeyOrFail("reqId"),
                ContextError,
            );
        });

        it("should throw error if context does not have key", () => {
            const ctx: Partial<Context> = {};
            const ctxManager = new ContextManager();

            ctxManager.run(() => {
                assert.strict.throws(
                    () => ctxManager.getByKeyOrFail("reqId"),
                    ContextError,
                );
            }, ctx);
        });
    });
});
