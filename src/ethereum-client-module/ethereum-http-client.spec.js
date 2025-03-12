"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var testing_1 = require("@nestjs/testing");
var axios_1 = require("@nestjs/axios");
var ethereum_http_client_1 = require("./ethereum-http-client");
var rxjs_1 = require("rxjs");
var bignumber_js_1 = require("bignumber.js");
var axios_2 = require("axios");
var config_service_1 = require("config-module/config.service");
describe('EthereumHttpClient', function () {
    var service;
    var httpService;
    // Mock data
    var mockRpcUrl = 'https://mock-eth-rpc.example.com';
    var mockChainId = 1;
    var mockLatestBlockHex = '0x100'; // 256 in decimal
    var mockBlocks = [
        {
            hash: '0x0000000000000000000000000000000000000000000000000000000000000001',
            number: '0x64', // 100 in decimal
            parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
            timestamp: '0x60c869a0', // Some timestamp
            transactions: [],
        },
        {
            hash: '0x0000000000000000000000000000000000000000000000000000000000000002',
            number: '0x65', // 101 in decimal
            parentHash: '0x0000000000000000000000000000000000000000000000000000000000000001',
            timestamp: '0x60c869b0', // Some timestamp
            transactions: [],
        },
        {
            hash: '0x0000000000000000000000000000000000000000000000000000000000000003',
            number: '0x66', // 102 in decimal
            parentHash: '0x0000000000000000000000000000000000000000000000000000000000000002',
            timestamp: '0x60c869c0', // Some timestamp
            transactions: [],
        },
    ];
    var mockLogs = [
        {
            blockNumber: 100,
            blockHash: '0x0000000000000000000000000000000000000000000000000000000000000001',
            transactionIndex: 0,
            removed: false,
            address: '0x1234567890123456789012345678901234567890',
            data: '0x1234',
            topics: [
                '0x0000000000000000000000000000000000000000000000000000000000000001',
                '0x0000000000000000000000000000000000000000000000000000000000000002',
            ],
            transactionHash: '0x0000000000000000000000000000000000000000000000000000000000000002',
            logIndex: 0,
        },
        {
            blockNumber: 101,
            blockHash: '0x0000000000000000000000000000000000000000000000000000000000000003',
            transactionIndex: 1,
            removed: false,
            address: '0x1234567890123456789012345678901234567890',
            data: '0x5678',
            topics: [
                '0x0000000000000000000000000000000000000000000000000000000000000001',
                '0x0000000000000000000000000000000000000000000000000000000000000003',
            ],
            transactionHash: '0x0000000000000000000000000000000000000000000000000000000000000004',
            logIndex: 0,
        },
    ];
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var mockConfigService, module;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockConfigService = {
                        getConfig: jest.fn().mockReturnValue({
                            network: {
                                rpcUrl: mockRpcUrl,
                                chainId: mockChainId,
                            },
                        }),
                    };
                    return [4 /*yield*/, testing_1.Test.createTestingModule({
                            imports: [axios_1.HttpModule],
                            providers: [
                                {
                                    provide: config_service_1.ConfigService, // Use the actual ConfigService class
                                    useValue: mockConfigService,
                                },
                                {
                                    provide: ethereum_http_client_1.EthereumHttpClient,
                                    useFactory: function (httpService, configService) {
                                        return new ethereum_http_client_1.EthereumHttpClient(httpService, configService.getConfig().network.rpcUrl);
                                    },
                                    inject: [axios_1.HttpService, config_service_1.ConfigService],
                                },
                            ],
                        }).compile()];
                case 1:
                    module = _a.sent();
                    service = module.get(ethereum_http_client_1.EthereumHttpClient);
                    httpService = module.get(axios_1.HttpService);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should be defined', function () {
        expect(service).toBeDefined();
    });
    describe('getUrl', function () {
        it('should return the provider URL', function () {
            expect(service.getUrl()).toBe(mockRpcUrl);
        });
    });
    describe('getLatestBlock', function () {
        it('should fetch the latest block number', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Mock the HTTP response
                        jest.spyOn(httpService, 'request').mockReturnValueOnce((0, rxjs_1.of)({
                            data: {
                                jsonrpc: '2.0',
                                id: 1,
                                result: mockLatestBlockHex,
                            },
                            status: 200,
                            statusText: 'OK',
                            headers: new axios_2.AxiosHeaders(),
                            config: {
                                headers: new axios_2.AxiosHeaders(),
                                url: mockRpcUrl,
                                method: 'post',
                            },
                        }));
                        return [4 /*yield*/, service.getLatestBlock()];
                    case 1:
                        result = _a.sent();
                        expect(httpService.request).toHaveBeenCalledWith({
                            url: mockRpcUrl,
                            method: 'post',
                            data: {
                                jsonrpc: '2.0',
                                method: 'eth_blockNumber',
                                params: [],
                                id: 1,
                            },
                            headers: { 'Content-Type': 'application/json' },
                        });
                        expect(result).toBe(mockLatestBlockHex);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('batchGetLatestBlocksWithoutLogs', function () {
        it('should fetch multiple blocks in a single request', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Mock the HTTP response
                        jest.spyOn(httpService, 'request').mockReturnValueOnce((0, rxjs_1.of)({
                            data: [
                                {
                                    jsonrpc: '2.0',
                                    id: 1,
                                    result: mockBlocks[0],
                                },
                                {
                                    jsonrpc: '2.0',
                                    id: 2,
                                    result: mockBlocks[1],
                                },
                                {
                                    jsonrpc: '2.0',
                                    id: 3,
                                    result: mockBlocks[2],
                                },
                            ],
                            status: 200,
                            statusText: 'OK',
                            headers: new axios_2.AxiosHeaders(),
                            config: {
                                headers: new axios_2.AxiosHeaders(),
                                url: mockRpcUrl,
                                method: 'post',
                            },
                        }));
                        return [4 /*yield*/, service.batchGetLatestBlocksWithoutLogs(100, 102)];
                    case 1:
                        result = _a.sent();
                        expect(httpService.request).toHaveBeenCalledWith({
                            url: mockRpcUrl,
                            method: 'post',
                            data: [
                                {
                                    jsonrpc: '2.0',
                                    method: 'eth_getBlockByNumber',
                                    params: ['0x64', false],
                                    id: 1,
                                },
                                {
                                    jsonrpc: '2.0',
                                    method: 'eth_getBlockByNumber',
                                    params: ['0x65', false],
                                    id: 2,
                                },
                                {
                                    jsonrpc: '2.0',
                                    method: 'eth_getBlockByNumber',
                                    params: ['0x66', false],
                                    id: 3,
                                },
                            ],
                            headers: { 'Content-Type': 'application/json' },
                        });
                        expect(result).toEqual([
                            {
                                hash: mockBlocks[0].hash,
                                number: parseInt(mockBlocks[0].number, 16),
                                parent: mockBlocks[0].parentHash,
                                timestamp: parseInt(mockBlocks[0].timestamp, 16),
                                logs: [],
                            },
                            {
                                hash: mockBlocks[1].hash,
                                number: parseInt(mockBlocks[1].number, 16),
                                parent: mockBlocks[1].parentHash,
                                timestamp: parseInt(mockBlocks[1].timestamp, 16),
                                logs: [],
                            },
                            {
                                hash: mockBlocks[2].hash,
                                number: parseInt(mockBlocks[2].number, 16),
                                parent: mockBlocks[2].parentHash,
                                timestamp: parseInt(mockBlocks[2].timestamp, 16),
                                logs: [],
                            },
                        ]);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('getLatestBlocksAndValidate', function () {
        it('should fetch and validate a range of blocks', function () { return __awaiter(void 0, void 0, void 0, function () {
            var blockRange, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        blockRange = { fromBlock: 100, toBlock: 102 };
                        // Mock the batchGetLatestBlocksWithoutLogs method
                        jest
                            .spyOn(service, 'batchGetLatestBlocksWithoutLogs')
                            .mockResolvedValueOnce([
                            {
                                hash: '0x0000000000000000000000000000000000000000000000000000000000000001',
                                number: 100,
                                parent: '0x0000000000000000000000000000000000000000000000000000000000000000',
                                timestamp: parseInt('0x60c869a0', 16),
                                logs: [],
                            },
                            {
                                hash: '0x0000000000000000000000000000000000000000000000000000000000000002',
                                number: 101,
                                parent: '0x0000000000000000000000000000000000000000000000000000000000000001',
                                timestamp: parseInt('0x60c869b0', 16),
                                logs: [],
                            },
                            {
                                hash: '0x0000000000000000000000000000000000000000000000000000000000000003',
                                number: 102,
                                parent: '0x0000000000000000000000000000000000000000000000000000000000000002',
                                timestamp: parseInt('0x60c869c0', 16),
                                logs: [],
                            },
                        ]);
                        return [4 /*yield*/, service.getLatestBlocksAndValidate(blockRange)];
                    case 1:
                        result = _a.sent();
                        expect(service.batchGetLatestBlocksWithoutLogs).toHaveBeenCalledWith(100, 102);
                        expect(result.length).toBe(3);
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw an error if parent hashes do not match', function () { return __awaiter(void 0, void 0, void 0, function () {
            var blockRange;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        blockRange = { fromBlock: 100, toBlock: 102 };
                        // Mock with incorrect parent hash
                        jest
                            .spyOn(service, 'batchGetLatestBlocksWithoutLogs')
                            .mockResolvedValueOnce([
                            {
                                hash: '0x0000000000000000000000000000000000000000000000000000000000000001',
                                number: 100,
                                parent: '0x0000000000000000000000000000000000000000000000000000000000000000',
                                timestamp: parseInt('0x60c869a0', 16),
                                logs: [],
                            },
                            {
                                hash: '0x0000000000000000000000000000000000000000000000000000000000000002',
                                number: 101,
                                parent: '0x0000000000000000000000000000000000000000000000000000000000000003', // Incorrect parent hash
                                timestamp: parseInt('0x60c869b0', 16),
                                logs: [],
                            },
                            {
                                hash: '0x0000000000000000000000000000000000000000000000000000000000000003',
                                number: 102,
                                parent: '0x0000000000000000000000000000000000000000000000000000000000000002',
                                timestamp: parseInt('0x60c869c0', 16),
                                logs: [],
                            },
                        ]);
                        return [4 /*yield*/, expect(service.getLatestBlocksAndValidate(blockRange)).rejects.toThrow('Expected parent hash to be 0x0000000000000000000000000000000000000000000000000000000000000001 but it was 0x0000000000000000000000000000000000000000000000000000000000000003')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('headerByNumber', function () {
        it('should fetch a block by number', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Mock the HTTP response for getBlockDirect
                        jest.spyOn(httpService, 'request').mockReturnValueOnce((0, rxjs_1.of)({
                            data: {
                                jsonrpc: '2.0',
                                id: 1,
                                result: {
                                    hash: '0x0000000000000000000000000000000000000000000000000000000000000001',
                                    parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
                                    number: '0x64', // 100 in hex
                                    timestamp: '0x60c869a0',
                                    transactions: [],
                                },
                            },
                            status: 200,
                            statusText: 'OK',
                            headers: new axios_2.AxiosHeaders(),
                            config: {
                                headers: new axios_2.AxiosHeaders(),
                                url: mockRpcUrl,
                                method: 'post',
                            },
                        }));
                        return [4 /*yield*/, service.headerByNumber(new bignumber_js_1.default(100))];
                    case 1:
                        result = _a.sent();
                        expect(httpService.request).toHaveBeenCalledWith({
                            url: mockRpcUrl,
                            method: 'post',
                            data: {
                                jsonrpc: '2.0',
                                method: 'eth_getBlockByNumber',
                                params: ['0x64', false],
                                id: 1,
                            },
                            headers: { 'Content-Type': 'application/json' },
                        });
                        expect(result).toEqual({
                            hash: '0x0000000000000000000000000000000000000000000000000000000000000001',
                            parent: '0x0000000000000000000000000000000000000000000000000000000000000000',
                            number: 100,
                            timestamp: parseInt('0x60c869a0', 16),
                            logs: [],
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should fetch the latest block when no number is provided', function () { return __awaiter(void 0, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Mock the HTTP response for getBlockDirect
                        jest.spyOn(httpService, 'request').mockReturnValueOnce((0, rxjs_1.of)({
                            data: {
                                jsonrpc: '2.0',
                                id: 1,
                                result: {
                                    hash: '0x0000000000000000000000000000000000000000000000000000000000000001',
                                    parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
                                    number: '0x64', // 100 in hex
                                    timestamp: '0x60c869a0',
                                    transactions: [],
                                },
                            },
                            status: 200,
                            statusText: 'OK',
                            headers: new axios_2.AxiosHeaders(),
                            config: {
                                headers: new axios_2.AxiosHeaders(),
                                url: mockRpcUrl,
                                method: 'post',
                            },
                        }));
                        return [4 /*yield*/, service.headerByNumber()];
                    case 1:
                        result = _a.sent();
                        expect(httpService.request).toHaveBeenCalledWith({
                            url: mockRpcUrl,
                            method: 'post',
                            data: {
                                jsonrpc: '2.0',
                                method: 'eth_getBlockByNumber',
                                params: ['latest', false],
                                id: 1,
                            },
                            headers: { 'Content-Type': 'application/json' },
                        });
                        expect(result).toEqual({
                            hash: '0x0000000000000000000000000000000000000000000000000000000000000001',
                            parent: '0x0000000000000000000000000000000000000000000000000000000000000000',
                            number: 100,
                            timestamp: parseInt('0x60c869a0', 16),
                            logs: [],
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw an error if the block is not found', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Mock the HTTP response for getBlockDirect with null result
                        jest.spyOn(httpService, 'request').mockReturnValueOnce((0, rxjs_1.of)({
                            data: {
                                jsonrpc: '2.0',
                                id: 1,
                                result: null,
                            },
                            status: 200,
                            statusText: 'OK',
                            headers: new axios_2.AxiosHeaders(),
                            config: {
                                headers: new axios_2.AxiosHeaders(),
                                url: mockRpcUrl,
                                method: 'post',
                            },
                        }));
                        return [4 /*yield*/, expect(service.headerByNumber(new bignumber_js_1.default(999))).rejects.toThrow('unknown block: 999')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('headerByHash', function () {
        it('should fetch a block by hash', function () { return __awaiter(void 0, void 0, void 0, function () {
            var blockHash, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        blockHash = '0x0000000000000000000000000000000000000000000000000000000000000001';
                        // Mock the HTTP response for getBlockDirect
                        jest.spyOn(httpService, 'request').mockReturnValueOnce((0, rxjs_1.of)({
                            data: {
                                jsonrpc: '2.0',
                                id: 1,
                                result: {
                                    hash: '0x0000000000000000000000000000000000000000000000000000000000000001',
                                    parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
                                    number: '0x64', // 100 in hex
                                    timestamp: '0x60c869a0',
                                    transactions: [],
                                },
                            },
                            status: 200,
                            statusText: 'OK',
                            headers: new axios_2.AxiosHeaders(),
                            config: {
                                headers: new axios_2.AxiosHeaders(),
                                url: mockRpcUrl,
                                method: 'post',
                            },
                        }));
                        return [4 /*yield*/, service.headerByHash(blockHash)];
                    case 1:
                        result = _a.sent();
                        expect(httpService.request).toHaveBeenCalledWith({
                            url: mockRpcUrl,
                            method: 'post',
                            data: {
                                jsonrpc: '2.0',
                                method: 'eth_getBlockByHash',
                                params: [blockHash, false],
                                id: 1,
                            },
                            headers: { 'Content-Type': 'application/json' },
                        });
                        expect(result).toEqual({
                            hash: '0x0000000000000000000000000000000000000000000000000000000000000001',
                            parent: '0x0000000000000000000000000000000000000000000000000000000000000000',
                            number: 100,
                            timestamp: parseInt('0x60c869a0', 16),
                            logs: [],
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('should throw an error if the block is not found', function () { return __awaiter(void 0, void 0, void 0, function () {
            var blockHash;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        blockHash = '0xnonexistentblockhash';
                        // Mock the HTTP response for getBlockDirect with null result
                        jest.spyOn(httpService, 'request').mockReturnValueOnce((0, rxjs_1.of)({
                            data: {
                                jsonrpc: '2.0',
                                id: 1,
                                result: null,
                            },
                            status: 200,
                            statusText: 'OK',
                            headers: new axios_2.AxiosHeaders(),
                            config: {
                                headers: new axios_2.AxiosHeaders(),
                                url: mockRpcUrl,
                                method: 'post',
                            },
                        }));
                        return [4 /*yield*/, expect(service.headerByHash(blockHash)).rejects.toThrow('unknown block: 0xnonexistentblockhash')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('filterLogs', function () {
        it('should fetch logs based on filter criteria', function () { return __awaiter(void 0, void 0, void 0, function () {
            var filter, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        filter = {
                            fromBlock: 100,
                            toBlock: 102,
                            topics: [
                                [
                                    '0x0000000000000000000000000000000000000000000000000000000000000001',
                                ],
                            ],
                        };
                        // Mock the HTTP response
                        jest.spyOn(httpService, 'request').mockReturnValueOnce((0, rxjs_1.of)({
                            data: {
                                jsonrpc: '2.0',
                                id: 1,
                                result: mockLogs,
                            },
                            status: 200,
                            statusText: 'OK',
                            headers: new axios_2.AxiosHeaders(),
                            config: {
                                headers: new axios_2.AxiosHeaders(),
                                url: mockRpcUrl,
                                method: 'post',
                            },
                        }));
                        return [4 /*yield*/, service.filterLogs(filter)];
                    case 1:
                        result = _a.sent();
                        // Update the expectation to match the exact order of properties in the actual call
                        expect(httpService.request).toHaveBeenCalledWith({
                            url: mockRpcUrl,
                            method: 'post',
                            data: {
                                jsonrpc: '2.0',
                                method: 'eth_getLogs',
                                params: [
                                    {
                                        fromBlock: '0x64',
                                        toBlock: '0x66',
                                        topics: [
                                            [
                                                '0x0000000000000000000000000000000000000000000000000000000000000001',
                                            ],
                                        ],
                                    },
                                ],
                                id: 1,
                            },
                            headers: { 'Content-Type': 'application/json' },
                        });
                        // The formatter will process the logs, but we're mocking that behavior
                        expect(result.length).toBe(2);
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
