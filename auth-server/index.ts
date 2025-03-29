
import cors from 'cors';
import express, { Router, type NextFunction, type Request, type Response } from 'express';
import { handleSignIn, handleSignOut } from './handlers/auth';
import { handleGetHasuraSessionVariables } from './handlers/hasura';
import logger from './logger';
import { authMiddleware } from './middlewares/auth';
import chalk from 'chalk';

const port = process.env.PORT;

if (!port) {
    logger.error('PORT variable not defined');
    process.exit(1);
}
const app = express();

const rootRouter = Router();
const authRouter = Router();
const securedRouter = Router();

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
    methods: ["GET", "POST", "PUT", "DELETE"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(`Error while handling ${req.url}`, err.message, err.stack);
    res.status(500).send('Something broke!')
});

rootRouter.get('/health', (_, res) => {
    res.status(200).json({ status: 'ok' });
});

authRouter.get('/sign-out', handleSignOut);
authRouter.post('/sign-in', handleSignIn);

securedRouter.use(authMiddleware);
securedRouter.get('/hasura/session', handleGetHasuraSessionVariables);

rootRouter.use("/", securedRouter);
rootRouter.use("/auth", authRouter);

app.use('/api', rootRouter);
app.listen(port, () => logger.info(`Server is running on port ${port}`));

