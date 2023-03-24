const path = require(`path`)
const fs = require('fs');
const _ = require("lodash")
const { createFilePath } = require(`gatsby-source-filesystem`)

exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions
  if (node.internal.type === `MarkdownRemark`) {
    const slug = createFilePath({ node, getNode, basePath: `posts` })
    createNodeField({
      node,
      name: `slug`,
      value: slug,
    })
  }
}

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions

  const mainTemplate = path.resolve(`./src/pages/index.tsx`)
  const blogPostTemplate = path.resolve(`./src/templates/blogPost.tsx`)

  const result = await graphql(`
    {
      postsRemark: allMarkdownRemark(
        filter: { fileAbsolutePath: { regex: "/(posts/blog)/" } }
        sort: { frontmatter: { date: DESC } }
        limit: 2000
      ) {
        edges {
          node {
            fields {
              slug
            }
          }
        }
      }
      categoriesGroup: allMarkdownRemark(limit: 2000) {
        group(field: { frontmatter: { category: SELECT } }) {
          fieldValue
          totalCount
        }
      }
    }
  `)

  const posts = result.data.postsRemark.edges

  posts.forEach(({ node }) => {
    createPage({
      path: node.fields.slug,
      component: blogPostTemplate,
      context: {
        slug: node.fields.slug,
      },
    })
  })

  const categories = result.data.categoriesGroup.group

  categories.forEach(category => {
    createPage({
      path: `/category/${_.kebabCase(category.fieldValue)}/`,
      component: mainTemplate,
      context: {
        category: category.fieldValue,
      },
    })
  })
}

exports.onPostBuild = async () => {
  const sourcePath = path.join(__dirname, 'public');
  const destPath = path.join(__dirname, 'docs');

  // Delete the `docs` directory and recreate
  if (fs.existsSync(destPath)) {
    fs.rmSync(destPath, { recursive: true, force: true });
  }
  fs.mkdirSync(destPath);

  // Loop through each file in the `public` directory
  fs.readdirSync(sourcePath).forEach((file) => {
    const sourceFile = path.join(sourcePath, file);
    const destFile = path.join(destPath, file);

    // Move the file to the `docs` directory
    fs.renameSync(sourceFile, destFile);
  });
};


