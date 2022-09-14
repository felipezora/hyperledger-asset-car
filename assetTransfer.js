/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class AssetTransfer extends Contract {

    async InitLedger(ctx) {
        const assets = [
            {
                ID: 'carro1',
                Registration: 'TAD338',
                Model: '2010',
                Brand: 'Suzuki',
                Color: 'Blue',
                Owner: 'Tomoko',
                EstimatedValue: 5000,
            },
            {
                ID: 'carro2',
                Registration: 'JZK041',
                Model: '2020',
                Brand: 'Ford',
                Color: 'Green',
                Owner: 'Carlos',
                EstimatedValue: 15000,
            },
            {
                ID: 'carro3',
                Registration: 'MBK391',
                Model: '2022',
                Brand: 'Chevrolet',
                Color: 'Red',
                Owner: 'Mario',
                EstimatedValue: 33000,
            },
            {
                ID: 'carro4',
                Registration: 'FAN238',
                Model: '2003',
                Brand: 'Nissan',
                Color: 'Black',
                Owner: 'Edison',
                EstimatedValue: 3500,
            },
            {
                ID: 'carro5',
                Registration: 'JFA901',
                Model: '2015',
                Brand: 'Toyota',
                Color: 'White',
                Owner: 'Juan',
                EstimatedValue: 8000,
            },
            {
                ID: 'carro6',
                Registration: 'GPQ023',
                Model: '2018',
                Brand: 'Renault',
                Color: 'Gray',
                Owner: 'Hernan',
                EstimatedValue: 9700,
            },
        ];

        for (const asset of assets) {
            asset.docType = 'asset';
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(asset.ID, Buffer.from(stringify(sortKeysRecursive(asset))));
        }
    }

    // CreateAsset issues a new asset to the world state with given details.
    async CreateAsset(ctx, id, registration, model, brand, color, owner, estimatedValue) {
        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`The asset ${id} already exists`);
        }

        const asset = {
            ID: id,
            Registration: registration,
            Model: model,
            Brand: brand,
            Color: color,
            Owner: owner,
            EstimatedValue: estimatedValue,
        };
        //we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async ReadAsset(ctx, id) {
        const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }

    // UpdateAsset updates an existing asset in the world state with provided parameters.
    async UpdateAsset(ctx, id, newColor, newEstimatedValue) {
        /*
        if(estimatedValue > assetJSON.EstimatedValue){
            throw new Error(`The new estimated value of ${id} is higher than the low estimated value`);
        }
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }

        // overwriting original asset with new asset
        const updatedAsset = {
            ID: assetJSON.ID,
            Registration: assetJSON.Registration,
            Model: assetJSON.Model,
            Brand: assetJSON.Brand,
            Color: color,
            Owner: assetJSON.Owner,
            EstimatedValue: estimatedValue,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));*/
        
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        if(newEstimatedValue > asset.EstimatedValue){
            throw new Error(`The new estimated value of ${id} is higher than the previous estimated value`);
        }
        const oldColor = asset.Color;
        asset.Color = newColor;
        asset.EstimatedValue = newEstimatedValue;
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return oldColor;
    }

    // DeleteAsset deletes an given asset from the world state.
    async DeleteAsset(ctx, id) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    // AssetExists returns true when asset with given ID exists in world state.
    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    // TransferAsset updates the owner field of asset with given id in the world state.
    async TransferAsset(ctx, id, newOwner) {
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        const oldOwner = asset.Owner;
        asset.Owner = newOwner;
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(asset))));
        return oldOwner;
    }

    // GetAllAssets returns all assets found in the world state.
    async GetAllAssets(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}

module.exports = AssetTransfer;
