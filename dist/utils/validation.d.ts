import { ValidationChain } from 'express-validator';
export declare const userValidation: {
    register: ValidationChain[];
    login: ValidationChain[];
    updateProfile: ValidationChain[];
    changePassword: ValidationChain[];
};
export declare const serviceRequestValidation: {
    create: ValidationChain[];
    updateStatus: ValidationChain[];
};
export declare const messageValidation: {
    send: ValidationChain[];
};
export declare const reviewValidation: {
    create: ValidationChain[];
};
export declare const paramValidation: {
    mongoId: (paramName?: string) => ValidationChain;
};
export declare const queryValidation: {
    pagination: ValidationChain[];
    userSearch: ValidationChain[];
};
//# sourceMappingURL=validation.d.ts.map