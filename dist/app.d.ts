import { Application } from 'express';
declare class App {
    app: Application;
    constructor();
    private ensureDatabaseConnection;
    private initializeMiddlewares;
    private initializeRoutes;
    private initializeErrorHandling;
    getApp(): Application;
}
export default App;
//# sourceMappingURL=app.d.ts.map