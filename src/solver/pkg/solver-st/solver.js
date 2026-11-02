let wasm;

const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

let cachedUint8Memory0 = null;

function getUint8Memory0() {
    if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

let cachedFloat32Memory0 = null;

function getFloat32Memory0() {
    if (cachedFloat32Memory0 === null || cachedFloat32Memory0.byteLength === 0) {
        cachedFloat32Memory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32Memory0;
}

let WASM_VECTOR_LEN = 0;

function passArrayF32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getFloat32Memory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8Memory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

const cachedTextEncoder = (typeof TextEncoder !== 'undefined' ? new TextEncoder('utf-8') : { encode: () => { throw Error('TextEncoder not available') } } );

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedInt32Memory0 = null;

function getInt32Memory0() {
    if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}

let cachedUint16Memory0 = null;

function getUint16Memory0() {
    if (cachedUint16Memory0 === null || cachedUint16Memory0.byteLength === 0) {
        cachedUint16Memory0 = new Uint16Array(wasm.memory.buffer);
    }
    return cachedUint16Memory0;
}

function getArrayU16FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint16Memory0().subarray(ptr / 2, ptr / 2 + len);
}

let cachedUint32Memory0 = null;

function getUint32Memory0() {
    if (cachedUint32Memory0 === null || cachedUint32Memory0.byteLength === 0) {
        cachedUint32Memory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32Memory0;
}

function passArray32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getUint32Memory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32Memory0().subarray(ptr / 4, ptr / 4 + len);
}

let cachedFloat64Memory0 = null;

function getFloat64Memory0() {
    if (cachedFloat64Memory0 === null || cachedFloat64Memory0.byteLength === 0) {
        cachedFloat64Memory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64Memory0;
}

function getArrayF64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat64Memory0().subarray(ptr / 8, ptr / 8 + len);
}
/**
*/
export class GameManager {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(GameManager.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_gamemanager_free(ptr);
    }
    /**
    * @returns {GameManager}
    */
    static new() {
        const ret = wasm.gamemanager_new();
        return GameManager.__wrap(ret);
    }
    /**
    * @param {Float32Array} oop_range
    * @param {Float32Array} ip_range
    * @param {Uint8Array} board
    * @param {number} starting_pot
    * @param {number} effective_stack
    * @param {number} rake_rate
    * @param {number} rake_cap
    * @param {boolean} donk_option
    * @param {string} oop_flop_bet
    * @param {string} oop_flop_raise
    * @param {string} oop_turn_bet
    * @param {string} oop_turn_raise
    * @param {string} oop_turn_donk
    * @param {string} oop_river_bet
    * @param {string} oop_river_raise
    * @param {string} oop_river_donk
    * @param {string} ip_flop_bet
    * @param {string} ip_flop_raise
    * @param {string} ip_turn_bet
    * @param {string} ip_turn_raise
    * @param {string} ip_river_bet
    * @param {string} ip_river_raise
    * @param {number} add_allin_threshold
    * @param {number} force_allin_threshold
    * @param {number} merging_threshold
    * @param {string} added_lines
    * @param {string} removed_lines
    * @returns {string | undefined}
    */
    init(oop_range, ip_range, board, starting_pot, effective_stack, rake_rate, rake_cap, donk_option, oop_flop_bet, oop_flop_raise, oop_turn_bet, oop_turn_raise, oop_turn_donk, oop_river_bet, oop_river_raise, oop_river_donk, ip_flop_bet, ip_flop_raise, ip_turn_bet, ip_turn_raise, ip_river_bet, ip_river_raise, add_allin_threshold, force_allin_threshold, merging_threshold, added_lines, removed_lines) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArrayF32ToWasm0(oop_range, wasm.__wbindgen_malloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passArrayF32ToWasm0(ip_range, wasm.__wbindgen_malloc);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passArray8ToWasm0(board, wasm.__wbindgen_malloc);
            const len2 = WASM_VECTOR_LEN;
            const ptr3 = passStringToWasm0(oop_flop_bet, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len3 = WASM_VECTOR_LEN;
            const ptr4 = passStringToWasm0(oop_flop_raise, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len4 = WASM_VECTOR_LEN;
            const ptr5 = passStringToWasm0(oop_turn_bet, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len5 = WASM_VECTOR_LEN;
            const ptr6 = passStringToWasm0(oop_turn_raise, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len6 = WASM_VECTOR_LEN;
            const ptr7 = passStringToWasm0(oop_turn_donk, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len7 = WASM_VECTOR_LEN;
            const ptr8 = passStringToWasm0(oop_river_bet, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len8 = WASM_VECTOR_LEN;
            const ptr9 = passStringToWasm0(oop_river_raise, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len9 = WASM_VECTOR_LEN;
            const ptr10 = passStringToWasm0(oop_river_donk, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len10 = WASM_VECTOR_LEN;
            const ptr11 = passStringToWasm0(ip_flop_bet, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len11 = WASM_VECTOR_LEN;
            const ptr12 = passStringToWasm0(ip_flop_raise, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len12 = WASM_VECTOR_LEN;
            const ptr13 = passStringToWasm0(ip_turn_bet, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len13 = WASM_VECTOR_LEN;
            const ptr14 = passStringToWasm0(ip_turn_raise, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len14 = WASM_VECTOR_LEN;
            const ptr15 = passStringToWasm0(ip_river_bet, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len15 = WASM_VECTOR_LEN;
            const ptr16 = passStringToWasm0(ip_river_raise, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len16 = WASM_VECTOR_LEN;
            const ptr17 = passStringToWasm0(added_lines, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len17 = WASM_VECTOR_LEN;
            const ptr18 = passStringToWasm0(removed_lines, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len18 = WASM_VECTOR_LEN;
            wasm.gamemanager_init(retptr, this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, starting_pot, effective_stack, rake_rate, rake_cap, donk_option, ptr3, len3, ptr4, len4, ptr5, len5, ptr6, len6, ptr7, len7, ptr8, len8, ptr9, len9, ptr10, len10, ptr11, len11, ptr12, len12, ptr13, len13, ptr14, len14, ptr15, len15, ptr16, len16, add_allin_threshold, force_allin_threshold, merging_threshold, ptr17, len17, ptr18, len18);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            let v20;
            if (r0 !== 0) {
                v20 = getStringFromWasm0(r0, r1).slice();
                wasm.__wbindgen_free(r0, r1 * 1);
            }
            return v20;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {number} player
    * @returns {Uint16Array}
    */
    private_cards(player) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.gamemanager_private_cards(retptr, this.__wbg_ptr, player);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v1 = getArrayU16FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 2);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {boolean} enable_compression
    * @returns {bigint}
    */
    memory_usage(enable_compression) {
        const ret = wasm.gamemanager_memory_usage(this.__wbg_ptr, enable_compression);
        return BigInt.asUintN(64, ret);
    }
    /**
    * @param {boolean} enable_compression
    */
    allocate_memory(enable_compression) {
        wasm.gamemanager_allocate_memory(this.__wbg_ptr, enable_compression);
    }
    /**
    * @param {number} current_iteration
    */
    solve_step(current_iteration) {
        wasm.gamemanager_solve_step(this.__wbg_ptr, current_iteration);
    }
    /**
    * @returns {number}
    */
    exploitability() {
        const ret = wasm.gamemanager_exploitability(this.__wbg_ptr);
        return ret;
    }
    /**
    */
    finalize() {
        wasm.gamemanager_finalize(this.__wbg_ptr);
    }
    /**
    * @param {Uint32Array} history
    */
    apply_history(history) {
        const ptr0 = passArray32ToWasm0(history, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        wasm.gamemanager_apply_history(this.__wbg_ptr, ptr0, len0);
    }
    /**
    * @param {Uint32Array} append
    * @returns {Uint32Array}
    */
    total_bet_amount(append) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray32ToWasm0(append, wasm.__wbindgen_malloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.gamemanager_total_bet_amount(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v2 = getArrayU32FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 4);
            return v2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @returns {string}
    */
    current_player() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.gamemanager_current_player(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
    * @returns {number}
    */
    num_actions() {
        const ret = wasm.gamemanager_num_actions(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * @param {Uint32Array} append
    * @returns {string}
    */
    actions_after(append) {
        let deferred2_0;
        let deferred2_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray32ToWasm0(append, wasm.__wbindgen_malloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.gamemanager_actions_after(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            deferred2_0 = r0;
            deferred2_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
        }
    }
    /**
    * @returns {bigint}
    */
    possible_cards() {
        const ret = wasm.gamemanager_possible_cards(this.__wbg_ptr);
        return BigInt.asUintN(64, ret);
    }
    /**
    * @returns {Float64Array}
    */
    get_results() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.gamemanager_get_results(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v1 = getArrayF64FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 8);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
    * @param {Uint32Array} append
    * @param {number} num_actions
    * @returns {Float64Array}
    */
    get_chance_reports(append, num_actions) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passArray32ToWasm0(append, wasm.__wbindgen_malloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.gamemanager_get_chance_reports(retptr, this.__wbg_ptr, ptr0, len0, num_actions);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var v2 = getArrayF64FromWasm0(r0, r1).slice();
            wasm.__wbindgen_free(r0, r1 * 8);
            return v2;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };

    return imports;
}

function __wbg_init_memory(imports, maybe_memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedFloat32Memory0 = null;
    cachedFloat64Memory0 = null;
    cachedInt32Memory0 = null;
    cachedUint16Memory0 = null;
    cachedUint32Memory0 = null;
    cachedUint8Memory0 = null;


    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(input) {
    if (wasm !== undefined) return wasm;

    if (typeof input === 'undefined') {
        input = new URL('solver_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
        input = fetch(input);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await input, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync }
export default __wbg_init;
