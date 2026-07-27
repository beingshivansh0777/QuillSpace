import swaggerJsdoc from "swagger-jsdoc";

// swagger-jsdoc scans the files listed in `apis` for JSDoc comment blocks
// starting with @openapi, and stitches them into one spec. Adding docs to
// a new route is just adding a comment above it in that route file — no
// separate doc file to keep in sync. 
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "QuillSpace API",
            version: "1.0.0",
            description: "API documentation for the QuillSpace blogging platform.",
        },
        servers: [
            { url: process.env.CLIENT_URL === "http://localhost:5173" ? "http://localhost:3000" : "" , description: "Current server" },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    apis: ["./routes/authRoutes.js", "./routes/blogRoutes.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;