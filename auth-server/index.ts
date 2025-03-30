import cors from 'cors';
import express, { Router, type NextFunction, type Request, type Response } from 'express';
import { handleAddUser, handleChangeUserRole, handleRemoveUser, handleSignIn, handleSignOut } from './handlers/auth';
import { handleGetHasuraSessionVariables } from './handlers/hasura';
import logger from './logger';
import { authMiddleware, rbacMiddleware } from './middlewares/auth';
import chalk from 'chalk';
import { checkAdmin, setupAdmin } from './admin-init';

logger.info('Checking for an administrator account...');

if (!await checkAdmin()) {
    logger.warn('Configuring Admin credentials...');
    const adminName = process.env['ADMIN_NAME'] ?? 'Administrator';
    const adminPassword = process.env['ADMIN_PASSWORD'];
    const adminEmail = process.env['ADMIN_EMAIL'];

    if (!adminPassword || !adminEmail) {
        const err = 'ADMIN_PASSWORD and ADMIN_EMAIL environment variables must be defined';
        logger.error(err);
        process.exit(1);
    }

    setupAdmin(adminName, adminEmail, adminPassword);
    logger.info('Admin credentials configured successfully.');
}

const port = process.env.PORT;

if (!port) {
    logger.error('PORT variable not defined');
    process.exit(1);
}
const app = express();

const rootRouter = Router();
const authRouter = Router();
const securedRouter = Router();
const adminRouter = Router();

app.set('trust proxy', true);
app.use((req, res, next) => {
    const { method, ip, url } = req;
    const start = Date.now();
    res.on('finish', () => {
        const { statusCode: status } = res;
        const diff = (Date.now() - start) / 1000;
        const msg = `${ip} ${method} - ${status} ${url} ${chalk.yellow(`+${diff.toPrecision(2)}s`)}`;
        if (status < 400) {
            logger.info(msg);
        } else if (status < 500) {
            logger.warn(msg);
        } else {
            logger.error(msg);
        }
    });
    next();
})
app.use(cors({
    credentials: true,
    origin: '*',
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((err: Error, req: Request, res: Response) => {
    logger.error(`Error while handling ${req.url}`, err.message, err.stack);
    res.status(500).json({ message: 'Something broke!' });
});

authRouter.post('/sign-in', handleSignIn);

adminRouter.use(rbacMiddleware('admin'));
adminRouter.post('/users', handleAddUser);
adminRouter.delete('/users', handleRemoveUser);
adminRouter.post('/change-role', handleChangeUserRole);

securedRouter.use(authMiddleware);
securedRouter.get('/auth/sign-out', handleSignOut);
securedRouter.get('/hasura/session', handleGetHasuraSessionVariables);


rootRouter.use("/", securedRouter);
rootRouter.use("/auth", authRouter);
rootRouter.use('/admin', adminRouter);

app.use('/api', rootRouter);
app.listen(port, () => logger.info(`Server is running on port ${port}`));

