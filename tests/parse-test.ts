import * as assert from 'assert';
import { it } from 'mocha';
import { insertStructureIntoNamespace } from '../src/scripts/parse/namespace';
import { parsePages } from '../src/scripts/parse/structure';
import { Class, Interface, Namespace, Page } from '../src/scripts/types';

describe('parse', () => {
    describe('structure', () => {
        const createPage = (fullName: string): Page => {
            return {
                name: fullName,
                events: [],
                methodSections: [],
                propertySections: [],
                url: '',
            };
        };

        it('parse basic page to class', () => {
            const page = createPage('Class');
            const result = parsePages([page]);

            assert.ok(result.namespace.structures.find((s) => s.name === 'Class'));
        });

        it('parse page to class with parent', () => {
            const page: Page = { ...createPage('Ns.ChildClass'), extends: ['ParentClass'] };
            const parent = createPage('ParentClass');
            const result = parsePages([parent, page]);

            const parentClass = result.namespace.structures.find((s) => s.name === 'ParentClass');
            const childClass = result.namespace.namespaces
                .find((ns) => ns.name === 'Ns')
                .structures.find((s) => s.name === 'ChildClass') as Class;

            assert.ok(parentClass, "Parent class can't be inserted into proper namespace.");
            assert.ok(childClass, "Child class can't be inserted into proper namespace.");
            assert.deepStrictEqual(childClass.parentClass, parentClass, "Child class doesn't have proper parent class");
        });
    });

    describe('namespace', () => {
        const testInterface: Interface = {
            type: 'interface',
            name: 'ITest',
            methods: [],
            interfaces: [],
        };

        const rootNamespace: Namespace = {
            namespaces: [],
            structures: [],
        };

        it('insert structure into root namespace', () => {
            const namespaceWithStructure = insertStructureIntoNamespace(testInterface, rootNamespace);

            assert.strictEqual(namespaceWithStructure.structures.length, 1);
        });

        it('insert structure into existing nested namespace', () => {
            const namespaceWithStructure = insertStructureIntoNamespace(
                { ...testInterface, namespace: 'l1' },
                {
                    ...rootNamespace,
                    namespaces: [
                        {
                            name: 'l1',
                            namespaces: [],
                            structures: [],
                        },
                    ],
                }
            );

            assert.strictEqual(namespaceWithStructure.namespaces[0].structures[0].namespace, 'l1');
        });

        it('insert structure into not existing nested namespace', () => {
            const namespaceWithStructure = insertStructureIntoNamespace({ ...testInterface, namespace: 'l1' }, rootNamespace);

            assert.strictEqual(namespaceWithStructure.namespaces.length, 1);
            assert.strictEqual(namespaceWithStructure.namespaces[0].structures[0].namespace, 'l1');
        });

        it("don't insert duplicite structure into namespace", () => {
            const namespaceWithStructure = insertStructureIntoNamespace(
                testInterface,
                insertStructureIntoNamespace(testInterface, rootNamespace)
            );

            assert.strictEqual(namespaceWithStructure.structures.length, 1);
        });
    });
});
