import * as fs from 'fs'
import * as path from 'path'
import * as React from 'react'
import { OnRenderBodyArgs, PluginOptions, WebpackStatFile } from './interfaces'

let webpackStatFile: WebpackStatFile
// No needs to re-validate the plugin options here, they are validated during "onCreateWebpackConfig" which happens first.
export function onRenderBody ({ setHeadComponents, setPostBodyComponents }: OnRenderBodyArgs, pluginOptions: PluginOptions) {
  // Don't emit other entry points unless we're building production pages
  // Consequently, other entry points won't run in develop mode
  if (process.env.NODE_ENV !== "production") return;
  
  if (!webpackStatFile) {
    const statFile = pluginOptions.statsFilePath || path.resolve('public', 'webpack.stats.json')
    let statFileContents: string
    try {
      statFileContents = fs.readFileSync(statFile, 'utf8')
    } catch (error) {
      throw new Error(`gatsby-plugin-webpack-entry: Failed to read the stats file ${statFile}. If you did not specify the option "statsFilePath" then this error is a problem with the plugin and the issue should be submitted to https://www.github.com/itmayziii/gatsby-plugin-webpack-entry/issues`)
    }
    try {
      webpackStatFile = JSON.parse(statFileContents)
    } catch (error) {
      throw new Error(`gatsby-plugin-webpack-entry: Failed to JSON parse the file ${statFile}`)
    }
  }

  var gatsby = require("gatsby");
  var withPrefix = gatsby.withAssetPrefix || gatsby.withPrefix;

  let entryLinks: React.ReactNode[] = []
  let entryScripts: React.ReactNode[] = []
  Object.keys(pluginOptions.entry).forEach((entry) => {
    webpackStatFile.namedChunkGroups[entry].assets.forEach((asset) => {
      const assetName = typeof asset === 'string' ? asset : asset?.name;

      // We should not add map files and Webpack runtime is already added by Gatsby.
      if (!assetName || assetName.endsWith('.map') || /webpack-runtime/.test(assetName)) return

      entryLinks.push(<link key={assetName} as='script' rel='preload' href={`${withPrefix("/" + assetName)}`}/>)
      entryScripts.push(<script key={assetName} src={`${withPrefix("/" + assetName)}`} async={true}/>)
    }, [])
  })

  setHeadComponents(entryLinks)
  setPostBodyComponents(entryScripts)
}
