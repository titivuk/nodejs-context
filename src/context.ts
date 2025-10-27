import { AsyncLocalStorage } from "node:async_hooks";

export type Context = {
    reqId: string;
    traceId: string;
};

const als = new AsyncLocalStorage<Partial<Context>>();

export class ContextError extends Error {}

export class ContextManager {
    run<R>(fn: () => R, store: Partial<Context> = {}): R {
        return als.run(store, fn);
    }

    set(key: keyof Context, value: Context[typeof key]) {
        const ctx = als.getStore();
        this.assertContext(ctx);

        ctx[key] = value;
    }

    get(): Partial<Context> | undefined {
        return als.getStore();
    }

    getOrFail(): Partial<Context> {
        const ctx = als.getStore();
        this.assertContext(ctx);

        return ctx;
    }

    getByKey(key: keyof Context): Context[typeof key] | undefined {
        return als.getStore()?.[key];
    }

    getByKeyOrFail(key: keyof Context): Context[typeof key] {
        const ctx = this.getOrFail();

        const val = ctx[key];
        if (!val) {
            throw new ContextError(`Context ${key} not found`);
        }

        return val;
    }

    private assertContext(ctx: unknown): asserts ctx {
        if (!ctx) throw new ContextError("Context is not initialized");
    }
}
