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
      // We should not add map files and Webpack runtime is already added by Gatsby.
      if (asset.endsWith('.map') || /webpack-runtime/.test(asset)) return

      entryLinks.push(<link key={asset} as='script' rel='preload' href={`${withPrefix("/" + asset)}`}/>)
      entryScripts.push(<script key={asset} src={`${withPrefix("/" + asset)}`} async={true}/>)
    }, [])
  })

  setHeadComponents(entryLinks)
  setPostBodyComponents(entryScripts)
}
