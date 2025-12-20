/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
    forbidden: [
        {
            name: 'no-circular',
            severity: 'error',
            comment:
                'This dependency is part of a circular relationship. You might want to revise ' +
                'your solution (e.g. use dependency inversion, standard interfaces, pull out ' +
                'common parts to a separate module)',
            from: {},
            to: { circular: true }
        }
    ],
    options: {
        doNotFollow: {
            path: 'node_modules'
        },
        tsPreCompilationDeps: true,
        tsConfig: {
            fileName: 'tsconfig.json'
        }
    }
};
