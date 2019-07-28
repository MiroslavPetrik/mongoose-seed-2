import mongoose from 'mongoose';
import chalk from 'chalk';

enum MONGOOSE_READYSTATE {
  CONNECTED = 1,
}

const defaultOptions = { useNewUrlParser: true, useCreateIndex: true };

export class Seeder {
  constructor(private mongoUrl: string, private options = defaultOptions) {
    this.options = { ...defaultOptions, ...this.options };
  }

  private async connect() {
    if (mongoose.connection.readyState !== MONGOOSE_READYSTATE.CONNECTED) {
      await mongoose.connect(this.mongoUrl, this.options);
    }
  }

  private async validateModels(models: string[]) {
    const invalidModels = models.filter(
      model => !mongoose.modelNames().includes(model)
    );

    if (invalidModels.length) {
      throw new Error('Models not registered in Mongoose: ' + invalidModels);
    }
  }

  async clearModels(modelNames: string[]) {
    await this.connect();
    await this.validateModels(modelNames);

    for (let modelName of modelNames) {
      await mongoose.model(modelName).deleteMany({});
      console.log(chalk.green(`${modelName} collection cleared.`));
    }
  }

  async populateModels(seedData: Record<string, object[]>) {
    await this.connect();

    const seedEntries = Object.entries(seedData);
    const modelNames = seedEntries.reduce<string[]>(
      (modelNames, [modelName]) => [...modelNames, modelName],
      []
    );

    await this.validateModels(modelNames);

    for (let [modelName, documents] of seedEntries) {
      const model = mongoose.model(modelName);

      for (let document of documents) {
        try {
          await model.create(document);
        } catch (error) {
          console.error(
            chalk.red(
              `Error creating document at index ${documents.indexOf(
                document
              )} of ${modelName} model`
            )
          );
        }
      }
    }
  }

  async disconnect() {
    await mongoose.disconnect();
  }
}
