import * as mongoose from 'mongoose';

import { Seeder } from '../src';

describe('mongoose-seeder', function() {
  const CONNECTION_URL = 'mongodb://localhost/test';

  const seeder = new Seeder(CONNECTION_URL);

  describe('#populateModels', () => {
    beforeAll(() => {
      mongoose.model('FooModel', new mongoose.Schema({ name: String }));
      mongoose.model('BarModel', new mongoose.Schema({ active: Boolean }));
    });

    it('throws when attempted to populate unknown models', async () => {
      // https://github.com/facebook/jest/issues/1700#issuecomment-377890222
      expect(
        seeder.populateModels({
          Unknown: [
            {
              key: 'bar',
            },
          ],
        })
      ).rejects.toThrow();
    });

    it('creates documents of defined model', async () => {
      await seeder.populateModels({
        FooModel: [
          {
            name: 'test',
          },
        ],
        BarModel: [
          {
            active: false,
          },
        ],
      });

      const foo = await mongoose.models.FooModel.findOne({ name: 'test' });

      expect(foo).toBeDefined();
      expect(foo.name).toEqual('test');

      const bar = await mongoose.models.BarModel.findOne({ active: false });

      expect(bar).toBeDefined();
      expect(bar.active).toEqual(false);
    });
  });

  describe('#clearModels', () => {
    beforeAll(async () => {
      mongoose.model(
        'TestModel',
        new mongoose.Schema({ key: { type: Number, unique: true } })
      );

      await seeder.populateModels({ TestModel: [{ key: 1 }, { key: 2 }] });

      const mockDocs = await mongoose.models.TestModel.find();

      expect(mockDocs).toBeDefined();
      expect(mockDocs).toHaveLength(2);
    });

    it('throws when attempted to clear unknown model', async () => {
      expect(seeder.clearModels(['Unknown'])).rejects.toThrow();
    });

    it('deletes documents of defined models', async () => {
      await seeder.clearModels(['TestModel']);

      const docs = await mongoose.models.TestModel.find();

      expect(docs).toEqual([]);
    });
  });

  afterAll(async () => {
    await seeder.disconnect();
  });
});
