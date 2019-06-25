const VERTICALS_URL = 'https://public-api.wordpress.com/wpcom/v2/verticals/m1/templates';

const fetch = require( 'node-fetch' );
const { parse } = require( '@wordpress/block-serialization-default-parser' );

const getTemplates = async () => {
    const data = await fetch( VERTICALS_URL );
    return data.json();
};

const countBlockStats = ( results, template, block ) => {
    const { blockName, innerBlocks } = block;
    let { templatesCount, totalCount } = results;
    if ( blockName == null ) {
        return results;
    }
    templatesCount[blockName] = templatesCount[blockName] ? templatesCount[blockName].add(template) : new Set([template]);
    totalCount[blockName] = totalCount[blockName] ? totalCount[blockName] + 1 : 1;
    if ( ! innerBlocks ) {
        console.log(block);
    }
    return innerBlocks.reduce( (result, innerBlock) => {
        return countBlockStats( result, template, innerBlock );
    }, {
        templatesCount,
        totalCount,
    });
}

const run = async () => {
    const { templates } = await getTemplates();
    const stats = templates.reduce( (result, template) => {
        const blocks = parse( template.content );
        return blocks.reduce(
            ( result, block ) => countBlockStats( result, template.slug, block ),
            result
        );
    }, {
        templatesCount: {},
        totalCount: {},
    })

    const allBlocks = Object.keys(stats.totalCount);
    const summary = allBlocks.reduce( ( result, block ) => {
        result[block] = {
            templates: stats.templatesCount[block].size / templates.length,
            total: stats.totalCount[block],
        };
        return result;
    }, {})
    console.log('block,templates,totalCount')
    allBlocks.forEach( (block) => {
        const templateCount = stats.templatesCount[block].size / templates.length;
        const total = stats.totalCount[block];
        console.log(`${block},${templateCount},${total}`);
    });
}

run();
// console.log(parse('<!-- wp:paragraph {"align":"left","fontSize":"small"} -->\n<p style="text-align:left;" class="has-small-font-size">We ❤️ our business. And we 💗 doing business with you. Great service, with a personal touch. That\'s our commitment.</p>\n<!-- /wp:paragraph -->'));
