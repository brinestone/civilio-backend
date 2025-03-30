import winston from "winston";

const transports: winston.transport[] = [
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp }) => {
                return `${timestamp} [${level}]: ${message}`;
            })
        )
    }),
];

if (!process.env.NODE_ENV || process.env.NODE_ENV == 'production') {
    transports.push(new winston.transports.File({ filename: 'error.log', level: 'error' }));
    transports.push(new winston.transports.File({ filename: 'access.log', level: 'info' }));
    transports.push(new winston.transports.File({ filename: 'access.log', level: 'warn' }));
    transports.push(new winston.transports.File({ filename: 'access.log', level: 'debug' }));
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports
});

export default logger;